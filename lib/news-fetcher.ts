
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { prisma } from './prisma';

const parser = new Parser();

export interface NewsItem {
  title: string;
  link: string;
  snippet: string;
  pubDate: string;
  source: string;
}

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  enabled?: boolean;
  isDefault?: boolean;
}

export const DEFAULT_RSS_SOURCES: RSSSource[] = [
  { id: 'winaero', name: 'winaero.com', url: 'https://winaero.com/feed/', isDefault: true },
  { id: 'microsoft', name: 'Microsoft Blog', url: 'https://blogs.windows.com/feed/', isDefault: true },
  { id: 'azure', name: 'Azure Blog', url: 'https://azure.microsoft.com/en-us/blog/feed/', isDefault: true },
  { id: 'wylsa', name: 'Wylsa.com', url: 'https://wylsa.com/feed/', isDefault: true }
];

async function scrapeSite(url: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);
    const items: NewsItem[] = [];

    // Helper to add item
    const addItem = (title: string, link: string, snippet: string, pubDate: string) => {
      if (title && link) {
        // Fix relative links
        if (link.startsWith('/')) {
            try {
                const urlObj = new URL(url);
                link = `${urlObj.protocol}//${urlObj.host}${link}`;
            } catch {}
        }
        
        items.push({
          title: title.trim(),
          link,
          snippet: snippet.trim(),
          pubDate,
          source: sourceName
        });
      }
    };

    // Strategy 1: WordPress style (.post, .type-post) and common article tags
    $('.post, .type-post, article, .article, .entry').each((_, el) => {
      const $el = $(el);
      const titleEl = $el.find('h2 a, h3 a, .entry-title a, .post-title a, .article-title a').first();
      
      if (titleEl.length > 0) {
        const title = titleEl.text();
        const link = titleEl.attr('href') || '';
        const snippet = $el.find('.entry-content, .post-excerpt, p, .excerpt').first().text();
        
        // Try to find date
        const dateEl = $el.find('time, .date, .post-date, .entry-date');
        const pubDate = dateEl.attr('datetime') || dateEl.text() || new Date().toISOString();
        
        addItem(title, link, snippet, pubDate);
      }
    });

    // Strategy 2: Wylsa style (.postCard)
    $('.postCard').each((_, el) => {
        const $el = $(el);
        const linkEl = $el.find('a.postCard-wrapper');
        const link = linkEl.attr('href') || '';
        const title = $el.find('.postCard-title h2').text();
        const snippet = ''; 
        const dateStr = $el.find('.postCard-timestamp').text().trim();
        
        // Parse relative Russian date if possible
        let pubDate = new Date().toISOString();
        try {
            if (dateStr.includes('назад')) {
                const num = parseInt(dateStr.match(/\d+/)?.[0] || '0');
                if (dateStr.includes('час')) {
                    pubDate = new Date(Date.now() - num * 60 * 60 * 1000).toISOString();
                } else if (dateStr.includes('минут')) {
                    pubDate = new Date(Date.now() - num * 60 * 1000).toISOString();
                } else if (dateStr.includes('ден') || dateStr.includes('дня')) {
                    pubDate = new Date(Date.now() - num * 24 * 60 * 60 * 1000).toISOString();
                }
            }
        } catch {}
        
        if (title && link) {
             addItem(title, link, snippet, pubDate);
        }
    });
    
    // If no items found, try searching for any link inside h1-h3 that looks like an article
    if (items.length === 0) {
        $('h1 a, h2 a, h3 a').each((_, el) => {
            const $el = $(el);
            const link = $el.attr('href');
            const title = $el.text();
            
            if (link && title && title.length > 10 && (link.includes('/20') || link.includes('article') || link.includes('news'))) {
                 addItem(title, link, '', new Date().toISOString());
            }
        });
    }

    return items;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return [];
  }
}

// Получить все источники (из БД + дефолтные)
export async function getAllSources(): Promise<RSSSource[]> {
  try {
    // Check if RSSSource model exists in Prisma Client
    if (!prisma.rSSSource) {
      console.error('RSSSource model not found in Prisma Client. Please run: npx prisma generate');
      // Return default sources as fallback
      return DEFAULT_RSS_SOURCES.map(s => ({ ...s, enabled: true }));
    }

    // Получаем источники из БД
    const dbSources = await prisma.rSSSource.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    // Преобразуем в нужный формат
    const sources: RSSSource[] = dbSources.map(source => ({
      id: source.id,
      name: source.name,
      url: source.url,
      enabled: source.enabled,
      isDefault: source.isDefault
    }));

    // Если в БД нет источников, создаем дефолтные
    if (sources.length === 0) {
      for (const defaultSource of DEFAULT_RSS_SOURCES) {
        try {
          await prisma.rSSSource.create({
            data: {
              id: defaultSource.id,
              name: defaultSource.name,
              url: defaultSource.url,
              enabled: true,
              isDefault: false
            }
          });
          sources.push({ ...defaultSource, enabled: true });
        } catch (error) {
          // Ignore if already exists
          console.error('Error creating default source:', error);
        }
      }
    }

    return sources;
  } catch (error) {
    console.error('Error loading sources from DB:', error);
    // Fallback to default sources
    return DEFAULT_RSS_SOURCES.map(s => ({ ...s, enabled: true }));
  }
}

export async function fetchNewsFromSources(enabledSourceIds: string[] = []): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  // If no sources enabled, return empty array
  if (enabledSourceIds.length === 0) {
    return [];
  }

  // Get all sources (from DB)
  const allSources = await getAllSources();
  
  // Filter sources by enabled IDs
  const enabledSources = allSources.filter(source => 
    enabledSourceIds.includes(source.id) && source.enabled !== false
  );

  for (const source of enabledSources) {
    let items: NewsItem[] = [];
    let rssSuccess = false;

    try {
      // Attempt to parse as RSS first
      const feed = await parser.parseURL(source.url);
      const feedItems: NewsItem[] = [];

      feed.items.forEach(item => {
        if (item.title && item.link) {
          feedItems.push({
            title: item.title,
            link: item.link,
            snippet: item.contentSnippet || item.content || '',
            pubDate: item.pubDate || new Date().toISOString(),
            source: source.name
          });
        }
      });

      // Check freshness logic
      // If the newest item is older than 30 days, consider it stale and try scraping
      if (feedItems.length > 0) {
        const newestDate = new Date(feedItems[0].pubDate).getTime();
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        if (newestDate < thirtyDaysAgo) {
            console.log(`Feed for ${source.name} seems stale (newest: ${feedItems[0].pubDate}). Falling back to scraping.`);
            rssSuccess = false; 
        } else {
            items = feedItems;
            rssSuccess = true;
        }
      } else {
         // Empty feed, try scrape
         rssSuccess = false;
      }
    } catch (error) {
      // console.error(`Error fetching RSS from ${source.name} (${source.url}):`, error);
      rssSuccess = false;
    }

    // Fallback to scraping if RSS failed or was stale
    if (!rssSuccess) {
        // Determine URL to scrape. If source.url is a feed URL, try to guess the site URL.
        let scrapeUrl = source.url;
        try {
            const urlObj = new URL(source.url);
            // Remove common feed paths if they are at the end
             if (urlObj.pathname.match(/\/feed\/?$/) || urlObj.pathname.match(/\/rss\/?$/) || urlObj.pathname.endsWith('.xml')) {
                scrapeUrl = `${urlObj.protocol}//${urlObj.host}`;
            }
        } catch {}

        // console.log(`Scraping ${scrapeUrl} for ${source.name}`);
        const scrapedItems = await scrapeSite(scrapeUrl, source.name);
        if (scrapedItems.length > 0) {
            items = scrapedItems;
        }
    }
    
    allNews.push(...items);
  }

  // Сортировка по дате (новые сверху)
  return allNews
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

// Legacy function for backward compatibility
export async function fetchMicrosoftNews(): Promise<NewsItem[]> {
  return fetchNewsFromSources(['microsoft', 'azure']);
}
