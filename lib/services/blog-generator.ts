import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';

// Helper to fetch RSS feed and get the latest items
async function fetchRssFeed(url: string) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    
    const items: any[] = [];
    $('item').each((i, el) => {
      items.push({
        title: $(el).find('title').text() || '',
        link: $(el).find('link').text() || '',
        description: $(el).find('description').text() || '',
        pubDate: $(el).find('pubDate').text() || '',
      });
    });
    
    return items;
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    return [];
  }
}

// Convert Cyrillic to Latin for clean URLs (ЧПУ)
function transliterate(text: string): string {
  const cyrillicToLatin: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '-', '_': '-'
  };
  return text.toLowerCase().replace(/[а-яё\s_]/g, match => cyrillicToLatin[match] || match);
}

// Parse inline markdown formats to HTML tags for Editor.js
function parseInlineFormats(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/__(.*?)__/g, '<b>$1</b>')
    .replace(/_(.*?)_/g, '<i>$1</i>')
    .replace(/`(.*?)`/g, '<code class="inline-code px-1 bg-secondary rounded text-sm">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-500 hover:underline">$1</a>');
}

// Convert Markdown to Editor.js JSON format
function convertMarkdownToEditorJs(markdown: string) {
  const blocks: any[] = [];
  const lines = markdown.split('\n');
  
  let inList = false;
  let listItems: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      if (inList) {
        blocks.push({ type: 'list', data: { style: 'unordered', items: listItems } });
        inList = false;
        listItems = [];
      }
      continue;
    }
    
    // Headers
    if (line.startsWith('#')) {
      if (inList) {
        blocks.push({ type: 'list', data: { style: 'unordered', items: listItems } });
        inList = false;
        listItems = [];
      }
      
      const level = line.match(/^#+/)?.[0].length || 2;
      const text = parseInlineFormats(line.replace(/^#+\s/, ''));
      blocks.push({ type: 'header', data: { text, level } });
      continue;
    }
    
    // Lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      inList = true;
      listItems.push(parseInlineFormats(line.replace(/^[-*]\s/, '')));
      continue;
    }
    
    // Paragraphs
    if (inList) {
      blocks.push({ type: 'list', data: { style: 'unordered', items: listItems } });
      inList = false;
      listItems = [];
    }
    blocks.push({ type: 'paragraph', data: { text: parseInlineFormats(line) } });
  }
  
  if (inList) {
    blocks.push({ type: 'list', data: { style: 'unordered', items: listItems } });
  }
  
  return {
    time: Date.now(),
    blocks,
    version: '2.28.0'
  };
}

// Ensure an AI Author exists
async function getOrCreateAiAuthor() {
  let user = await prisma.user.findFirst({
    where: { email: 'ai-robot@example.com' }
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'ai-robot@example.com',
        name: 'AI Agent',
        username: 'ai-agent',
        role: 'EDITOR',
        bio: 'Искусственный интеллект, генерирующий свежие новости и статьи.',
      }
    });
  }
  return user;
}

export async function runBlogGenerator(
  limit: number = 1, 
  topicsString: string = "Искусственный интеллект, Нейросети",
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<{ added: number, titles: string[] }> {
  console.log(`🧠 Запуск AI Авто-Блогера (Лимит: ${limit}) 🧠`);
  
  const addedTitles: string[] = [];
  const author = await getOrCreateAiAuthor();
  
  let processedCount = 0;
  
  // Decide whether to use RSS or generic topics (50/50 chance if RSS sources exist)
  const rssSources = await prisma.rSSSource.findMany({ where: { enabled: true } });
  const topics = topicsString.split(',').map(t => t.trim()).filter(Boolean);
  
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }
  
  const OpenAI = require('openai').default;
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  for (let i = 0; i < limit; i++) {
    try {
      const useRss = rssSources.length > 0 && Math.random() > 0.5;
      let prompt = '';
      let sourceUrl = '';
      let generatedTitle = '';
      let generatedTags = ['AI'];
      
      if (useRss) {
        // RSS Mode: Summarize/Rewrite news
        const source = rssSources[Math.floor(Math.random() * rssSources.length)];
        const msgRss = `Анализ RSS ленты: ${source.name}`;
        console.log(`📡 ${msgRss}`);
        onProgress?.(msgRss, i + 1, limit);
        
        const items = await fetchRssFeed(source.url);
        
        if (items.length === 0) continue;
        
        // Pick a random recent item
        const item = items[Math.floor(Math.random() * Math.min(5, items.length))];
        sourceUrl = item.link;
        
        prompt = `Ты - ИТ-журналист. Напиши полноценную статью-новость на русском языке на основе следующей информации:
Заголовок новости: ${item.title}
Текст: ${item.description}

ВАЖНЫЕ ПРАВИЛА:
1. Выдай только готовый Markdown текст статьи. Не пиши "Конечно" или "Вот статья".
2. Статья должна быть подробной, интересной и читабельной.
3. Разбей текст на абзацы и добавь подзаголовки (##).
4. Обязательно в конце сделай вывод или заключение.
5. Первая строка (с одним #) должна быть Заголовком статьи. Заголовок должен быть цепляющим.
6. В самом конце, на новой строке, напиши PROMPT для генерации обложки на английском языке (1-2 предложения, детальное визуальное описание без текста), вот так: "IMAGE_PROMPT: A futuristic cyberpunk city with neon lights..."
7. На самой последней строке напиши ТЕГИ через запятую, вот так: "TAGS: ИИ, Нейросети, GPT" (максимум 4 тега).`;
      } else {
        // Topic Mode: Generate generic article
        const topic = topics.length > 0 ? topics[Math.floor(Math.random() * topics.length)] : "Будущее IT";
        const msgTopic = `ИИ придумывает статью на тему: ${topic}`;
        console.log(`💡 ${msgTopic}`);
        onProgress?.(msgTopic, i + 1, limit);
        
        prompt = `Ты - креативный и экспертный ИТ-журналист. 
Выбери ОДНУ очень узкую, конкретную и малоизвестную подтему в рамках широкой категории: "${topic}".
Напиши глубокую, профессиональную и абсолютно УНИКАЛЬНУЛЮ статью на эту узкую тему на русском языке.
Избегай банальных рассуждений (например, "ИИ меняет мир"). Углубись в конкретику, кейсы, неожиданные парадоксы или новые технологии.

ВАЖНЫЕ ПРАВИЛА:
1. Выдай только готовый Markdown текст статьи. Не пиши "Конечно" или "Вот статья".
2. Статья должна быть подробной, интересной, с фактами и рассуждениями (объем от 2000 символов).
3. Используй подзаголовки (##) и маркированные списки для читабельности.
4. Первая строка (с одним #) должна быть Заголовком статьи.
5. В самом конце, на новой строке, напиши PROMPT для генерации обложки на английском языке (1-2 предложения, детальное визуальное описание без текста), вот так: "IMAGE_PROMPT: A glowing quantum computer core..."
6. На самой последней строке напиши ТЕГИ через запятую, вот так: "TAGS: ${topic}, Аналитика" (максимум 4 тега).`;
      }

      console.log('  ⏳ Генерация текста...');
      onProgress?.('Нейросеть генерирует контент...', i + 1, limit);
      
      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: "anthropic/claude-3.5-haiku",
          messages: [{ "role": "system", "content": prompt }],
        });
      } catch (apiError: any) {
        if (apiError?.status === 429 || apiError?.code === 429) {
          console.log('  ⚠️ Лимит запросов (429)! Ждем 15 секунд и пробуем запасную модель...');
          onProgress?.('Таймаут API. Ожидание и переключение на запасную нейросеть...', i + 1, limit);
          await new Promise(r => setTimeout(r, 15000));
          completion = await openai.chat.completions.create({
            model: "qwen/qwen-2.5-72b-instruct",
            messages: [{ "role": "system", "content": prompt }],
          });
        } else {
          throw apiError;
        }
      }
      
      const responseText = completion.choices[0].message.content || '';
      
      // Parse output
      let title = "ИИ-новости";
      let tags = ['AI', 'Новости'];
      let markdownContent = responseText;
      
      // Extract title
      const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
        // Remove title from markdown content as we store it separately
        markdownContent = markdownContent.replace(/^#\s+(.+)$/m, '').trim();
      }
      
      // Extract tags
      const tagsMatch = markdownContent.match(/TAGS:\s+(.+)$/im);
      if (tagsMatch) {
        tags = tagsMatch[1].split(',').map((t: string) => t.trim());
        markdownContent = markdownContent.replace(/TAGS:\s+(.+)$/im, '').trim();
      }
      
      // Extract image prompt
      let imagePrompt = `Tech cyberpunk concept art for ${title}`;
      const imagePromptMatch = markdownContent.match(/IMAGE_PROMPT:\s+(.+)$/im);
      if (imagePromptMatch) {
        imagePrompt = imagePromptMatch[1].trim();
        markdownContent = markdownContent.replace(/IMAGE_PROMPT:\s+(.+)$/im, '').trim();
      }
      
      // Generate excerpt
      let excerpt = markdownContent.substring(0, 200).replace(/#/g, '').trim() + '...';
      
      // Generate unique slug using Transliteration
      const cleanTitle = transliterate(title);
      const baseSlug = cleanTitle.replace(/[^a-z0-9\-]+/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
      const slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
      
      // Image generation via free AI (Pollinations.ai)
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(imagePrompt);
      const dynamicCoverImage = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&nologo=true&seed=${seed}`;
      
      // Convert Markdown to EditorJS JSON
      const editorJson = convertMarkdownToEditorJs(markdownContent);
      
      // Save post
      await prisma.post.create({
        data: {
          title,
          slug,
          excerpt,
          content: JSON.stringify(editorJson),
          coverImage: dynamicCoverImage,
          tags: JSON.stringify(tags),
          readTime: `${Math.max(2, Math.floor(markdownContent.length / 800))} мин`,
          authorId: author.id,
          sources: sourceUrl ? JSON.stringify([sourceUrl]) : null,
          publishedAt: new Date(),
        }
      });
      
      console.log(`  ✅ Статья опубликована: ${title}`);
      
      // Сразу создаем запись в логе
      await prisma.automationLog.create({
        data: {
          type: "BLOG",
          status: "SUCCESS",
          itemsAdded: 1,
          message: `Статья успешно опубликована: ${title}`
        }
      });
      
      onProgress?.(`Опубликовано: ${title}`, i + 1, limit);
      addedTitles.push(title);
      processedCount++;
      
    } catch (e) {
      console.error(`  ❌ Ошибка генерации статьи:`, e);
    }
    
    // Задержка 5 секунд между запросами для обхода лимитов (429 Too Many Requests) бесплатного API OpenRouter
    if (i < limit - 1) {
      console.log('  ⏳ Ожидание 5 секунд перед следующим запросом...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return { added: processedCount, titles: addedTitles };
}
