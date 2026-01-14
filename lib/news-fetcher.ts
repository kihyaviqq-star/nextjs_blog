
import Parser from 'rss-parser';
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
    try {
      const feed = await parser.parseURL(source.url);

      feed.items.forEach(item => {
        if (item.title && item.link) {
          allNews.push({
            title: item.title,
            link: item.link,
            snippet: item.contentSnippet || item.content || '',
            pubDate: item.pubDate || new Date().toISOString(),
            source: source.name
          });
        }
      });
    } catch (error) {
      console.error(`Error fetching RSS from ${source.name} (${source.url}):`, error);
    }
  }

  // Сортировка по дате (новые сверху)
  return allNews
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

// Legacy function for backward compatibility
export async function fetchMicrosoftNews(): Promise<NewsItem[]> {
  return fetchNewsFromSources(['microsoft', 'azure']);
}
