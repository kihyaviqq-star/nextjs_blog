
import Parser from 'rss-parser';

const parser = new Parser();

export interface NewsItem {
  title: string;
  link: string;
  snippet: string;
  pubDate: string;
  source: string;
}

const SOURCES = [
  'https://blogs.windows.com/feed/',
  'https://azure.microsoft.com/en-us/blog/feed/'
];

export async function fetchMicrosoftNews(): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  for (const url of SOURCES) {
    try {
      const feed = await parser.parseURL(url);
      const sourceName = url.includes('azure') ? 'Azure Blog' : 'Windows Blog';

      feed.items.forEach(item => {
        if (item.title && item.link) {
          allNews.push({
            title: item.title,
            link: item.link,
            snippet: item.contentSnippet || item.content || '',
            pubDate: item.pubDate || new Date().toISOString(),
            source: sourceName
          });
        }
      });
    } catch (error) {
      console.error(`Error fetching RSS from ${url}:`, error);
    }
  }

  // Сортировка по дате (новые сверху)
  return allNews
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 5); // Возвращаем только 5 последних
}
