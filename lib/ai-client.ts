
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const SITE_NAME = 'AI-Stat Generator';

export interface GeneratedArticle {
  title: string;
  blocks: any[];
  tags: string[];
  slug: string;
  coverImage?: string;
}

export async function generateImagePrompt(topic: string, summary: string): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set');

  // Use a text model to generate the image prompt
  const model = process.env.OPENROUTER_ARTICLE_MODEL || 'google/gemini-2.0-flash-thinking:free';
  
  const systemPrompt = `Ты — арт-директор. Твоя задача — создать детальный промпт на английском языке для генерации обложки статьи (Text-to-Image).
  
  Стиль (единый для всех):
  - Plasticine 3D style, claymation, handmade textures
  - Cute, colorful, soft lighting, rounded shapes
  - Playful but professional
  - Clean background
  - STRICTLY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS inside the image
  - Abstract or metaphorical representation of the topic

  Верни ТОЛЬКО текст промпта на английском языке, без кавычек и вступлений.`;

  const userPrompt = `Тема статьи: ${topic}\nКраткое содержание: ${summary}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) throw new Error(`OpenRouter API Error: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Image Prompt Generation failed:', error);
    throw error;
  }
}

export async function generateImage(prompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set');

  const imageModel = process.env.OPENROUTER_IMAGE_MODEL || 'bytedance-seed/seedream-4.5';
  
  try {
    // Try OpenRouter image generation API first
    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageModel,
        prompt: prompt,
        n: 1,
        size: '1200x630',
      })
    });

    if (response.ok) {
      const data = await response.json();
      // OpenRouter image API typically returns data array with url or b64_json
      if (data.data && data.data[0]) {
        if (data.data[0].url) {
          return data.data[0].url;
        } else if (data.data[0].b64_json) {
          // Convert base64 to data URL
          return `data:image/png;base64,${data.data[0].b64_json}`;
        }
      }
    }

    // Fallback to Pollinations.ai if OpenRouter doesn't work
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
    return imageUrl;
  } catch (error) {
    console.error('Image generation error, using fallback:', error);
    // Fallback to Pollinations.ai
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
    return imageUrl;
  }
}

export async function generateArticle(topic: string, context: string, model?: string): Promise<GeneratedArticle> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const selectedModel = model || process.env.OPENROUTER_ARTICLE_MODEL || 'google/gemini-2.0-flash-thinking:free';

  const systemPrompt = `Ты — профессиональный IT-журналист и редактор. 
  Твоя задача — взять исходный контент (новость, статью или скрапленный текст) и написать увлекательную, структурированную статью на русском языке.
  
  Если исходный контент содержит HTML-теги, лишние пробелы или неструктурированный текст — очисти его и преобразуй в читаемый формат.
  Если контент уже хорошо структурирован — используй его как основу, но улучши стиль и читаемость.
  
  Формат вывода: EditorJS JSON Blocks (строго совместимый с Editor.js).
  Ты должен вернуть массив блоков (blocks) внутри JSON объекта в формате Editor.js.
  
  Поддерживаемые типы блоков:
  1. header: { "type": "header", "data": { "text": "Заголовок", "level": 2 } }
  2. paragraph: { "type": "paragraph", "data": { "text": "Текст с <b>жирным</b> и <i>курсивом</i>" } }
  3. list: { "type": "list", "data": { "style": "unordered", "items": ["Пункт 1", "Пункт 2"] } }
  4. quote: { "type": "quote", "data": { "text": "Цитата", "caption": "Автор" } }
  5. warning: { "type": "warning", "data": { "title": "Заголовок", "message": "Сообщение" } }
  6. delimiter: { "type": "delimiter", "data": {} }
  7. code: { "type": "code", "data": { "code": "код здесь" } }

  Структура статьи:
  - Введение (Paragraph) - краткое введение в тему
  - Основной контент (Header level 2 + Paragraphs) - разбивай на логические разделы
  - Детали/Списки (List) - если есть перечисления
  - Цитаты если есть (Quote)
  - Заключение (Paragraph) - краткое резюме

  ВАЖНО: Верни ответ ТОЛЬКО в формате валидного JSON (minified, в одну строку).
  - Убедись, что это валидный JSON.
  - Экранируй все двойные кавычки внутри контента (\\").
  - Не используй переносы строк (Enter) для форматирования самого JSON объекта.
  - Не используй неэкранированные управляющие символы.
  - Каждый блок должен иметь правильную структуру с "type" и "data".
  - Генерируй релевантные теги на основе содержания статьи (МАКСИМУМ 3 тега, не больше).

  Формат ответа (строго):
  {
    "title": "Заголовок статьи",
    "blocks": [
      { "type": "paragraph", "data": { "text": "Текст..." } },
      { "type": "header", "data": { "text": "Заголовок раздела", "level": 2 } }
    ],
    "tags": ["тег1", "тег2", "тег3"] // МАКСИМУМ 3 тега, не больше!
    "slug": "url-friendly-slug-transliterated-to-english"
  }`;

  const userPrompt = `Тема: ${topic}\n\nКонтекст/Источник:\n${context}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Попытка извлечь JSON из ответа (если есть лишний текст)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    
    try {
      const article = JSON.parse(jsonContent) as GeneratedArticle;
      // Ограничиваем количество тегов до 3 максимум
      if (article.tags && article.tags.length > 3) {
        article.tags = article.tags.slice(0, 3);
      }
      return article;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw Content:', content);
      
      // Попытка исправить распространенные ошибки
      // 1. Экранируем некорректные слэши (Bad escaped character), исключая валидные управляющие символы и юникод
      // 2. Экранируем переносы строк (частая проблема с HTML в JSON)
      const fixedContent = jsonContent
        .replace(/\\(?!["\\/bfnrtu])/g, "\\\\") 
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
        
      try {
        const article = JSON.parse(fixedContent) as GeneratedArticle;
        // Ограничиваем количество тегов до 3 максимум
        if (article.tags && article.tags.length > 3) {
          article.tags = article.tags.slice(0, 3);
        }
        return article;
      } catch (retryError) {
        throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    }
  } catch (error) {
    console.error('AI Generation failed:', error);
    throw error;
  }
}
