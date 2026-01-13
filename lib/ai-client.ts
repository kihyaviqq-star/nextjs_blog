
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

  const model = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-2.0-flash-thinking:free';
  
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
  // Использование Pollinations.ai (бесплатно, работает без ключа)
  // Мы используем сгенерированный OpenRouter промпт для получения уникальной картинки в нужном стиле
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
  
  // Проверяем доступность (опционально)
  return imageUrl;
}

export async function generateArticle(topic: string, context: string, model?: string): Promise<GeneratedArticle> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const selectedModel = model || process.env.OPENROUTER_ARTICLE_MODEL || 'google/gemini-2.0-flash-thinking:free';

  const systemPrompt = `Ты — профессиональный IT-журналист, эксперт по продуктам Microsoft. 
  Твоя задача — взять техническую новость и написать увлекательную статью на русском языке. 
  
  Формат вывода: EditorJS JSON Blocks.
  Ты должен вернуть массив блоков (blocks) внутри JSON объекта.
  
  Поддерживаемые типы блоков:
  1. header (level: 2 или 3)
  2. paragraph (с поддержкой <b>, <i>, <a href="...">)
  3. list (style: "unordered" или "ordered")
  4. quote (text, caption)
  5. warning (title, message) - используй для важных предупреждений или заметок
  6. delimiter (без данных)
  7. code (code) - для команд или кода

  Структура статьи:
  - Введение (Paragraph)
  - Суть (Header + Paragraphs)
  - Детали/Списки (List)
  - Цитаты если есть (Quote)
  - Заключение (Paragraph)

  ВАЖНО: Верни ответ ТОЛЬКО в формате валидного JSON (minified, в одну строку).
  - Убедись, что это валидный JSON.
  - Экранируй все двойные кавычки внутри контента (\\").
  - Не используй переносы строк (Enter) для форматирования самого JSON объекта.
  - Не используй неэкранированные управляющие символы.

  Формат:
  {
    "title": "Заголовок статьи",
    "blocks": [
      { "type": "paragraph", "data": { "text": "Текст..." } },
      { "type": "header", "data": { "text": "Заголовок раздела", "level": 2 } }
    ],
    "tags": ["тег1", "тег2"],
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
      return JSON.parse(jsonContent) as GeneratedArticle;
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
        return JSON.parse(fixedContent) as GeneratedArticle;
      } catch (retryError) {
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }
    }
  } catch (error) {
    console.error('AI Generation failed:', error);
    throw error;
  }
}
