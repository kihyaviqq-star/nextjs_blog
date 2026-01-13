/**
 * URL Scraper - Extracts main content from web pages
 * Uses fetch + basic HTML parsing to extract article content
 */

export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  try {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

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
      throw new Error('Could not extract meaningful content from the page');
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
