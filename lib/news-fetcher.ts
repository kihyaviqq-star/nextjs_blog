
import Parser from 'rss-parser';

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
}

export const RSS_SOURCES: RSSSource[] = [
  // { id: 'comss', name: 'www.comss.ru', url: 'https://www.comss.ru/rss.php' }, // Broken feed
  { id: 'winaero', name: 'winaero.com', url: 'https://winaero.com/feed/' },
  { id: 'microsoft', name: 'Microsoft Blog', url: 'https://blogs.windows.com/feed/' },
  { id: 'azure', name: 'Azure Blog', url: 'https://azure.microsoft.com/en-us/blog/feed/' },
  { id: 'wylsa', name: 'Wylsa.com', url: 'https://wylsa.com/feed/' }
];

export async function fetchNewsFromSources(enabledSourceIds: string[] = []): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  // If no sources enabled, return empty array
  if (enabledSourceIds.length === 0) {
    return [];
  }

  // Filter sources by enabled IDs
  const enabledSources = RSS_SOURCES.filter(source => enabledSourceIds.includes(source.id));

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
