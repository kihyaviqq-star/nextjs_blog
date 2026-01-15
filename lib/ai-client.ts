
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

  const systemPrompt = process.env.ARTICLE_GENERATION_PROMPT;
  
  if (!systemPrompt) {
    throw new Error('ARTICLE_GENERATION_PROMPT is not set in .env file');
  }

  const userPrompt = `Вот исходный текст на английском:
${context}

Напиши на его основе статью на русском языке.`;

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
    
    // Попытка извлечь JSON из ответа (если есть лишний текст)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    
    try {
      let article = JSON.parse(jsonContent) as GeneratedArticle;

      // --- Force Image Injection Logic ---
      // Extract images from context
      const imageMarkers = context.match(/\[IMAGE: (.*?)\]/g);
      if (imageMarkers && imageMarkers.length > 0) {
        const sourceImages = imageMarkers.map(m => m.replace('[IMAGE: ', '').replace(']', '').trim());
        
        // Ensure blocks exists
        if (!article.blocks) article.blocks = [];

        // Check which images are already in the article blocks
        const usedImages = new Set();
        article.blocks.forEach(block => {
           if (block.type === 'image' && block.data?.file?.url) {
             usedImages.add(block.data.file.url);
           }
        });

        // Identify missing images
        const missingImages = sourceImages.filter(url => !usedImages.has(url));

        // Inject missing images
        if (missingImages.length > 0) {
           // Insert missing images at the end of the article
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
      // -----------------------------------

      // Ограничиваем количество тегов до 3 максимум
      if (article.tags && article.tags.length > 3) {
        article.tags = article.tags.slice(0, 3);
      }
      return article;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      // console.error('Raw Content:', content); // Too large, maybe log substring
      console.error('Raw Content Preview:', content.substring(0, 200) + '...' + content.substring(content.length - 200));

      // Попытка исправить распространенные ошибки
      let fixedContent = jsonContent;
      
      // 1. Remove invalid control characters (keep newlines/tabs as they are valid in JSON structure, but problematic in strings if unescaped)
      // We'll trust the parser for main structure newlines.
      fixedContent = fixedContent.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F]/g, "");

      // 2. Fix bad escapes (backslashes that aren't escaping anything valid)
      fixedContent = fixedContent.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

      try {
        let article = JSON.parse(fixedContent) as GeneratedArticle;

        // --- Force Image Injection Logic (Duplicate for Retry) ---
        // Extract images from context
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
        // ---------------------------------------------------------

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
