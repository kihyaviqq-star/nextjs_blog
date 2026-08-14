const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const SITE_NAME = 'AI-Stat Generator';

export interface GeneratedArticle {
  title: string;
  excerpt?: string;
  blocks: any[];
  tags: string[];
  slug: string;
  coverImage?: string;
}

export interface AiModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export const AVAILABLE_AI_MODELS: AiModelOption[] = [
  {
    id: "google/gemini-2.0-flash-thinking:free",
    name: "Gemini 2.0 Flash Thinking",
    provider: "Google",
    description: "Быстрая рассуждающая модель (по умолчанию)",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    description: "Передовая модель с глубоким анализом и отличным русским языком",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Оптимальный баланс скорости и качества",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Премиальное качество текста и литературный стиль",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta",
    description: "Мощная открытая модель с широким кругозором",
  },
];

export type ArticleStyle = "news" | "analytical" | "tutorial" | "comparison";

export const ARTICLE_STYLE_PRESETS: Record<
  ArticleStyle,
  { label: string; description: string; instructions: string }
> = {
  news: {
    label: "Горячая новость",
    description: "Кратко, динамично, с упором на ключевые факты и цифры",
    instructions:
      "Стиль: оперативная новость. Заголовок цепляющий и лаконичный. В начале краткий лид (2-3 предложения), далее ключевые факты, цитаты и выводы без лишней воды.",
  },
  analytical: {
    label: "Аналитический обзор",
    description: "Глубокий разбор темы, анализ трендов, плюсы и минусы",
    instructions:
      "Стиль: экспертный аналитический обзор. Подробно объясни контекст, разбери архитектуру/механику, приведи взвешенные плюсы и минусы, дай прогноз влияния на индустрию.",
  },
  tutorial: {
    label: "Пошаговый гайд",
    description: "Практическое руководство с шагами, советами и кодом",
    instructions:
      "Стиль: понятный пошаговый гайд / туториал. Разбей материал на последовательные шаги (Шаг 1, Шаг 2...), добавь примеры использования, советы и частые ошибки.",
  },
  comparison: {
    label: "Сравнение и подборка",
    description: "Сопоставление нескольких решений или инструментов",
    instructions:
      "Стиль: сравнительный анализ. Сравни ключевые альтернативы по критериям: возможности, производительность, цены, для кого подходит.",
  },
};

const DEFAULT_SYSTEM_PROMPT = `Ты — профессиональный технический редактор и IT-журналист.
Твоя задача — написать качественную, структурированную и интересную статью на русском языке на основе предоставленного материала.

Формат ответа — СТРОГО валидный JSON следующей структуры:
{
  "title": "Цепляющий заголовок статьи",
  "excerpt": "Краткое описание (2-3 предложения) для карточки статьи и TL;DR",
  "tags": ["Тег1", "Тег2", "Тег3"],
  "blocks": [
    { "type": "paragraph", "data": { "text": "Вводный текст статьи..." } },
    { "type": "header", "data": { "text": "Заголовок первого раздела", "level": 2 } },
    { "type": "paragraph", "data": { "text": "Текст раздела..." } },
    { "type": "list", "data": { "style": "unordered", "items": ["Пункт 1", "Пункт 2"] } }
  ]
}

Правила:
- Используй богатую структуру блоков: paragraph, header (level: 2 или 3), list (unordered или ordered), quote, warning.
- Не используй markdown в JSON, форматируй через блоки Editor.js.
- Теги: максимум 3 релевантных тега на русском или английском.
- Верни ТОЛЬКО чистый JSON, без обратных кавычек и markdown блоков.`;

export async function generateImagePrompt(topic: string, summary: string): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set');

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
      if (data.data && data.data[0]) {
        if (data.data[0].url) {
          return data.data[0].url;
        } else if (data.data[0].b64_json) {
          return `data:image/png;base64,${data.data[0].b64_json}`;
        }
      }
    }

    // Fallback to Pollinations.ai if OpenRouter doesn't work
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
  } catch (error) {
    console.error('Image generation error, using fallback:', error);
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
  }
}

export async function generateArticle(
  topic: string,
  context: string,
  model?: string,
  style: ArticleStyle = "news"
): Promise<GeneratedArticle> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const selectedModel = model || process.env.OPENROUTER_ARTICLE_MODEL || 'google/gemini-2.0-flash-thinking:free';
  const baseSystemPrompt = process.env.ARTICLE_GENERATION_PROMPT || DEFAULT_SYSTEM_PROMPT;
  const styleInstruction = ARTICLE_STYLE_PRESETS[style]?.instructions || "";

  const systemPrompt = `${baseSystemPrompt}\n\nДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ К СТИЛЮ:\n${styleInstruction}`;

  const userPrompt = `Тема статьи: ${topic}\n\nИсходный материал / контекст:\n${context}\n\nНапиши на его основе полноценную статью на русском языке в формате JSON.`;

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
        temperature: 0.7,
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
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    
    try {
      let article = JSON.parse(jsonContent) as GeneratedArticle;

      // Extract images from context if any
      const imageMarkers = context.match(/\[IMAGE: (.*?)\]/g);
      if (imageMarkers && imageMarkers.length > 0) {
        const sourceImages = imageMarkers.map(m => m.replace('[IMAGE: ', '').replace(']', '').trim());
        if (!article.blocks) article.blocks = [];

        const usedImages = new Set();
        article.blocks.forEach(block => {
          if (block.type === 'image' && block.data?.file?.url) {
            usedImages.add(block.data.file.url);
          }
        });

        const missingImages = sourceImages.filter(url => !usedImages.has(url));
        if (missingImages.length > 0) {
          missingImages.forEach((url) => {
            article.blocks.push({
              type: 'image',
              data: {
                file: { url: url },
                caption: '',
                withBorder: false,
                withBackground: false,
                stretched: false
              }
            });
          });
        }
      }

      if (article.tags && article.tags.length > 3) {
        article.tags = article.tags.slice(0, 3);
      }
      return article;
    } catch (parseError) {
      console.error('JSON Parse Error, attempting recovery:', parseError);
      let fixedContent = jsonContent
        .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F]/g, "")
        .replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

      const article = JSON.parse(fixedContent) as GeneratedArticle;
      if (article.tags && article.tags.length > 3) {
        article.tags = article.tags.slice(0, 3);
      }
      return article;
    }
  } catch (error) {
    console.error('AI Generation failed:', error);
    throw error;
  }
}
