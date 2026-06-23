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
6. В самом конце, на новой строке, напиши ТЕГИ через запятую, вот так: "TAGS: ИИ, Нейросети, GPT" (максимум 4 тега).`;
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
5. В самом конце, на новой строке, напиши ТЕГИ через запятую, вот так: "TAGS: ${topic}, Аналитика" (максимум 4 тега).`;
      }

      console.log('  ⏳ Генерация текста...');
      onProgress?.('Нейросеть генерирует контент...', i + 1, limit);
      
      const completion = await openai.chat.completions.create({
        model: "google/gemma-4-31b-it:free",
        messages: [{ "role": "system", "content": prompt }],
      });
      
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
      
      // Generate excerpt
      let excerpt = markdownContent.substring(0, 200).replace(/#/g, '').trim() + '...';
      
      // Generate unique slug using Transliteration
      const cleanTitle = transliterate(title);
      const baseSlug = cleanTitle.replace(/[^a-z0-9\-]+/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
      const slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
      
      // Image generation via Unsplash
      const techImageIds = [
        '1677442136019-21780ecad995', '1676277791608-ac68e4e3f97c', '1576091160399-112ba8d25d1d',
        '1507146426996-ef05306b995a', '1591488320449-011701bb6704', '1555066931-4365d14bab8c',
        '1503676260728-1c00da094a0b', '1547826039-bfc35e0f1ea8', '1635070041078-e363dbe005cb',
        '1518770660439-4636190af475', '1526374965328-7f61d4dc18c5', '1451187580459-43490279c0fa',
        '1519389953810-195a98bd8f48', '1550751827-4bd374c3f58b', '1531297172864-07186ddfb6ed',
        '1517433622941-afb229ebfc1c', '1519389953810-195a98bd8f48', '1504384308090-c894fdcc538d',
        '1525547719571-a2d4ac8945e2', '1488590528505-98d2b5aba04b', '1515879218367-8466d910aaa4',
        '1498050108023-c5249f4df085', '1558494949-ef010cbdcc31', '1581091226825-a6a2a5aee158',
        '1484417894907-623262ce5141', '1504868584819-450d9824bf25', '1550751827-4bd374c3f58b'
      ];
      const randomImageId = techImageIds[Math.floor(Math.random() * techImageIds.length)];
      const dynamicCoverImage = `https://images.unsplash.com/photo-${randomImageId}?q=80&w=2070&auto=format&fit=crop`;
      
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
      onProgress?.(`Опубликовано: ${title}`, i + 1, limit);
      addedTitles.push(title);
      processedCount++;
      
    } catch (e) {
      console.error(`  ❌ Ошибка генерации статьи:`, e);
    }
  }
  
  return { added: processedCount, titles: addedTitles };
}
