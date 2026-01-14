import { lookup } from 'dns/promises';
import * as cheerio from 'cheerio';

/**
 * URL Scraper - Extracts main content from web pages
 * Uses fetch + Cheerio to extract article content
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
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  try {
    const parsedUrl = new URL(url);
    
    // Block non-http protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol. Only HTTP/HTTPS allowed.');
    }

    // SSRF Protection: Resolve and check IP
    try {
      const { address } = await lookup(parsedUrl.hostname);
      if (isPrivateIP(address)) {
        throw new Error(`Access denied to private IP: ${address}`);
      }
    } catch (e: any) {
      if (e.message.includes('Access denied')) throw e;
      console.warn(`DNS lookup failed for ${parsedUrl.hostname}: ${e.message}`);
    }

    // Fetch the page with browser-like headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

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
        if (src.startsWith('data:') || src.includes('icon') || src.includes('logo') || src.includes('spacer')) {
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

