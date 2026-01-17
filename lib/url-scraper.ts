import { lookup } from 'dns/promises';
import * as cheerio from 'cheerio';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const SITE_NAME = 'AI-Stat Generator';

/**
 * URL Scraper - Extracts main content from web pages
 * Uses fetch + Cheerio (traditional) or AI parsing (intelligent extraction)
 */

function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;

  // 127.0.0.0/8
  if (parts[0] === 127) return true;
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 0.0.0.0/8
  if (parts[0] === 0) return true;
  // 169.254.0.0/16
  if (parts[0] === 169 && parts[1] === 254) return true;

  return false;
}

export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  images?: string[]; // Optional array of image URLs found in the content
}

/**
 * AI-powered content extraction from HTML
 * Fallback when direct AI browsing doesn't work - uses fetched HTML
 */
async function scrapeUrlWithAI(html: string, url: string): Promise<ScrapedContent> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set. AI parsing requires API key.');
  }

  const model = process.env.OPENROUTER_ARTICLE_MODEL || 'google/gemini-2.0-flash-thinking:free';

  // Limit HTML size to avoid token limits (keep first 100KB)
  const limitedHtml = html.length > 100000 ? html.substring(0, 100000) + '...' : html;

  const systemPrompt = `Ты — эксперт по извлечению контента из веб-страниц. Твоя задача — проанализировать HTML и извлечь структурированную информацию об статье.

Извлеки:
1. Заголовок статьи (title)
2. Основной текстовый контент статьи (удали навигацию, рекламу, комментарии, футер, хедер)
3. Все изображения из статьи (URL абсолютные, включая lazy-loaded images, background-images из стилей, data-attributes)

Верни результат в формате JSON:
{
  "title": "Заголовок статьи",
  "content": "Текстовое содержание статьи, очищенное от HTML",
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
}

Важно:
- Изображения должны быть абсолютными URL
- Удали все рекламные элементы, навигацию, футеры, хедеры
- Сохрани только основной контент статьи
- Если есть lazy-loaded изображения (data-src, data-original), используй их`;

  const userPrompt = `Вот HTML страницы (URL: ${url}):
${limitedHtml}

Извлеки структурированную информацию об статье.`;

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
        temperature: 0.3, // Lower temperature for more accurate extraction
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    let parsed: { title: string; content: string; images?: string[] };
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error('AI returned invalid JSON format');
    }

    // Make image URLs absolute
    const absoluteImages = (parsed.images || []).map(img => {
      try {
        return new URL(img, url).href;
      } catch {
        return img;
      }
    }).filter(Boolean);

    // Format content with image markers
    let formattedContent = parsed.content;
    if (absoluteImages.length > 0) {
      formattedContent += '\n\n' + absoluteImages.map(img => `[IMAGE: ${img}]`).join('\n');
    }

    return {
      title: parsed.title || 'Untitled Article',
      content: formattedContent,
      url,
      images: absoluteImages,
    };
  } catch (error: any) {
    throw new Error(`AI parsing failed: ${error.message}`);
  }
}

/**
 * AI-powered content extraction directly from URL (bypassing fetch)
 * Uses AI with web browsing capabilities to read and parse web pages
 */
async function scrapeUrlWithAIDirect(url: string): Promise<ScrapedContent> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set. AI parsing requires API key.');
  }

  // Use a model with web browsing capabilities
  // Try :online variant first, or use web plugin
  const model = (process.env.OPENROUTER_ARTICLE_MODEL || 'google/gemini-2.0-flash-thinking:free').replace(/:online$/, '');
  const modelWithOnline = model.includes(':') ? model : `${model}:online`;

  const systemPrompt = `Ты — эксперт по извлечению контента из веб-страниц. Твоя задача — прочитать веб-страницу и извлечь структурированную информацию об статье.

Извлеки:
1. Заголовок статьи (title)
2. Основной текстовый контент статьи (удали навигацию, рекламу, комментарии, футер, хедер)
3. Все изображения из статьи (URL абсолютные, включая lazy-loaded images, background-images из стилей, data-attributes)

Верни результат ТОЛЬКО в формате JSON, без дополнительных комментариев:
{
  "title": "Заголовок статьи",
  "content": "Текстовое содержание статьи, очищенное от HTML",
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
}

Важно:
- Изображения должны быть абсолютными URL
- Удали все рекламные элементы, навигацию, футеры, хедеры
- Сохрани только основной контент статьи
- Если есть lazy-loaded изображения (data-src, data-original), используй их`;

  const userPrompt = `Прочитай следующую веб-страницу и извлеки структурированную информацию об статье:

URL: ${url}

Извлеки заголовок, основной контент и все изображения из статьи.`;

  console.log(`[AI Direct Parsing] Starting AI web browsing for URL: ${url}`);
  const startTime = Date.now();

  try {
    // Add timeout for AI requests (90 seconds max - web browsing can be slow)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for AI

    // Try with :online variant first (direct web browsing)
    console.log(`[AI Direct Parsing] Trying model: ${modelWithOnline}`);
    let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelWithOnline,
        temperature: 0.3, // Lower temperature for more accurate extraction
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    clearTimeout(timeoutId);

    // If :online variant fails, try with web plugin
    if (!response.ok) {
      console.warn(`[AI Direct Parsing] Model ${modelWithOnline} failed (${response.status}), trying with web plugin...`);
      const pluginController = new AbortController();
      const pluginTimeoutId = setTimeout(() => pluginController.abort(), 90000);
      
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME,
          'Content-Type': 'application/json',
        },
        signal: pluginController.signal,
        body: JSON.stringify({
          model: model,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          plugins: [{ id: 'web' }]
        })
      });
      
      clearTimeout(pluginTimeoutId);
    }

    if (!response.ok) {
      throw new Error(`OpenRouter API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    let parsed: { title: string; content: string; images?: string[] };
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error('AI returned invalid JSON format');
    }

    // Make image URLs absolute
    const absoluteImages = (parsed.images || []).map(img => {
      try {
        return new URL(img, url).href;
      } catch {
        return img;
      }
    }).filter(Boolean);

    // Format content with image markers
    let formattedContent = parsed.content;
    if (absoluteImages.length > 0) {
      formattedContent += '\n\n' + absoluteImages.map(img => `[IMAGE: ${img}]`).join('\n');
    }

    const elapsed = Date.now() - startTime;
    console.log(`[AI Direct Parsing] Successfully parsed in ${elapsed}ms, found ${absoluteImages.length} images`);
    
    return {
      title: parsed.title || 'Untitled Article',
      content: formattedContent,
      url,
      images: absoluteImages,
    };
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    if (error.name === 'AbortError') {
      console.error(`[AI Direct Parsing] Request timeout after ${elapsed}ms`);
      throw new Error(`AI parsing timeout: The request took too long (90s limit). The website may be slow or the AI model is overloaded.`);
    }
    console.error(`[AI Direct Parsing] Error after ${elapsed}ms:`, error.message);
    throw new Error(`AI parsing failed: ${error.message}`);
  }
}

export async function scrapeUrl(url: string, useAI: boolean = true): Promise<ScrapedContent> {
  try {
    const parsedUrl = new URL(url);
    
    // Block non-http protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol. Only HTTP/HTTPS allowed.');
    }

    // SSRF Protection: Resolve and check IP (skip for AI direct browsing, but still validate URL)
    try {
      const { address } = await lookup(parsedUrl.hostname);
      if (isPrivateIP(address)) {
        throw new Error(`Access denied to private IP: ${address}`);
      }
    } catch (e: any) {
      if (e.message.includes('Access denied')) throw e;
      console.warn(`DNS lookup failed for ${parsedUrl.hostname}: ${e.message}`);
    }

    // Try AI direct web browsing first (bypasses fetch issues completely)
    if (useAI && OPENROUTER_API_KEY) {
      try {
        return await scrapeUrlWithAIDirect(url);
      } catch (aiDirectError: any) {
        console.warn('AI direct web browsing failed, trying fetch + AI parsing:', aiDirectError.message);
        // Continue to fetch + AI parsing fallback
      }
    }

    // Fetch the page with browser-like headers and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        },
        signal: controller.signal,
        // @ts-ignore - Next.js fetch supports this
        next: { revalidate: 0 }, // Disable caching
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout: The website took too long to respond (30s limit)');
      }
      // Check for common fetch errors
      if (fetchError.message?.includes('fetch failed') || fetchError.message?.includes('ECONNREFUSED')) {
        throw new Error(`Connection failed: The website may be down or unreachable. ${fetchError.message}`);
      }
      if (fetchError.message?.includes('certificate') || fetchError.message?.includes('SSL') || fetchError.message?.includes('TLS')) {
        throw new Error(`SSL/TLS error: ${fetchError.message}`);
      }
      throw new Error(`Network error: ${fetchError.message || 'Unknown error'}`);
    }

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error(`Access denied (Anti-bot protection): ${response.status}`);
      }
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Check for common anti-bot signatures
    if (html.includes('__js_p_') || html.includes('ddos-guard') || html.includes('Just a moment...')) {
      throw new Error('Site is protected by anti-bot system (Cloudflare/DDoS-Guard)');
    }

    // Use AI parsing if requested
    if (useAI && OPENROUTER_API_KEY) {
      try {
        return await scrapeUrlWithAI(html, url);
      } catch (aiError: any) {
        console.warn('AI parsing failed, falling back to traditional parsing:', aiError.message);
        // Fall through to traditional parsing
      }
    }

    // Traditional Cheerio-based parsing
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, noscript, iframe, svg, nav, footer, header, aside, .sidebar, .ads, .comment, .menu, .navigation, .cookie-banner').remove();

    // Extract title
    const title = $('title').first().text() || 
                  $('h1').first().text() || 
                  $('meta[property="og:title"]').attr('content') || 
                  'Untitled Article';

    // Find main content
    // Try specific selectors first, then fallback
    let $content = $('article').first();
    
    if ($content.length === 0) {
      $content = $('main').first();
    }
    
    // Heuristics for common content classes if semantic tags missing
    if ($content.length === 0) {
      const contentSelectors = [
        '.content', '.post-content', '.entry-content', '.article-body', 
        '#content', '#main', '.post', '.article'
      ];
      
      for (const selector of contentSelectors) {
        const found = $(selector);
        if (found.length > 0) {
          // Pick the one with the most text
          let bestEl = found.first();
          let maxLen = bestEl.text().length;
          
          found.each((i, el) => {
            const len = $(el).text().length;
            if (len > maxLen) {
              maxLen = len;
              bestEl = $(el);
            }
          });
          
          $content = bestEl;
          break;
        }
      }
    }

    // Fallback: use body if nothing specific found (risky but better than empty)
    if ($content.length === 0) {
      $content = $('body');
    }

    // Process images within the content
    $content.find('img').each((i, el) => {
      const $img = $(el);
      // Prioritize data-src/data-original for lazy loaded images
      let src = $img.attr('data-src') || 
                $img.attr('data-original') || 
                $img.attr('data-lazy-src') ||
                $img.attr('src');

      if (src) {
        // Filter out icons, spacers, etc.
        if (src.startsWith('data:') || src.includes('icon') || src.includes('logo') || src.includes('spacer') || src.includes('pixel') || src.includes('avatar')) {
          $img.remove();
          return;
        }

        try {
          // Resolve relative URLs
          const absoluteUrl = new URL(src, url).href;
          $img.replaceWith(`\n[IMAGE: ${absoluteUrl}]\n`);
        } catch (e) {
          // Invalid URL, just remove
          $img.remove();
        }
      } else {
        $img.remove();
      }
    });

    // Clean up structure for better text extraction
    $content.find('br').replaceWith('\n');
    $content.find('p, div, h1, h2, h3, h4, h5, h6, li').after('\n\n');

    let contentText = $content.text();

    // Clean up whitespace
    contentText = contentText
      .replace(/[ \t]+/g, ' ') // Normalize spaces
      .replace(/\n\s+\n/g, '\n\n') // Remove lines with just spaces
      .replace(/\n{3,}/g, '\n\n') // Limit newlines
      .trim();

    if (!contentText || contentText.length < 50) {
      throw new Error('Could not extract meaningful content. The site might be protected or using dynamic rendering.');
    }

    return {
      title: title.trim(),
      content: contentText.substring(0, 15000), // Limit content length
      url
    };

  } catch (error: any) {
    throw new Error(`Failed to scrape URL: ${error.message}`);
  }
}

function extractTextFromHtml(html: string): string {
  // Deprecated/Unused helper if we switch to Cheerio inside scrapeUrl
  // But keeping a simple version just in case other modules use it (though they shouldn't)
  return html.replace(/<[^>]+>/g, '');
}

function decodeHtmlEntities(text: string): string {
  // Cheerio handles decoding automatically, so this is less needed but kept for safety
  return text; 
}

