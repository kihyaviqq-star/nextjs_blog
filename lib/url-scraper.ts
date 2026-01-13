import { lookup } from 'dns/promises';

/**
 * URL Scraper - Extracts main content from web pages
 * Uses fetch + basic HTML parsing to extract article content
 */

function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false; // Not an IPv4 address (could be IPv6, handled separately or ignored for now if we only check IPv4)

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
      // If DNS fails, fetch will fail anyway, but we can let it proceed if it was just a lookup error 
      // (though safer to fail open only if we are sure). 
      // For security, if we can't resolve, we shouldn't fetch.
      console.warn(`DNS lookup failed for ${parsedUrl.hostname}: ${e.message}`);
    }

    // Fetch the page with browser-like headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'max-age=0',
        'Upgrade-Insecure-Requests': '1',
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

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                      html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                      html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    
    let title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
    title = decodeHtmlEntities(title);

    // Extract main content - try multiple strategies
    let content = '';

    // Strategy 1: Try to find article tag
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      content = extractTextFromHtml(articleMatch[1]);
    } else {
      // Strategy 2: Try to find main content divs
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                       html.match(/<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                       html.match(/<div[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      
      if (mainMatch) {
        content = extractTextFromHtml(mainMatch[1]);
      } else {
        // Strategy 3: Extract all paragraph text
        const paragraphMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
        if (paragraphMatches) {
          content = paragraphMatches
            .map(p => extractTextFromHtml(p))
            .filter(text => text.length > 20) // Filter out very short paragraphs
            .join('\n\n');
        }
      }
    }

    // Fallback: If no content found, use body text
    if (!content || content.length < 100) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        content = extractTextFromHtml(bodyMatch[1]);
      }
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .trim();

    if (!content || content.length < 50) {
      throw new Error('Could not extract meaningful content. The site might be protected or using dynamic rendering.');
    }

    return {
      title,
      content: content.substring(0, 10000), // Limit content length
      url
    };
  } catch (error: any) {
    throw new Error(`Failed to scrape URL: ${error.message}`);
  }
}

function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove HTML tags but preserve line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = decodeHtmlEntities(text);
  
  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };

  return text.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}
