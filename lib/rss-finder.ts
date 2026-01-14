/**
 * RSS Feed Finder - Automatically discovers RSS feeds from website URLs
 */

export interface RSSFeedInfo {
  url: string;
  title?: string;
}

/**
 * Common RSS feed paths to try
 */
const COMMON_RSS_PATHS = [
  '/feed',
  '/rss',
  '/feed.xml',
  '/rss.xml',
  '/atom.xml',
  '/feed.rss',
  '/rss.php',
  '/feed/',
  '/rss/',
  '/index.xml',
  '/blog/feed',
  '/blog/rss',
  '/news/feed',
  '/news/rss',
];

/**
 * Find RSS feed URL from a website URL
 */
export async function findRSSFeed(siteUrl: string): Promise<RSSFeedInfo | null> {
  try {
    // Normalize URL
    let url: URL;
    try {
      url = new URL(siteUrl);
    } catch {
      // Try adding https:// if no protocol
      try {
        url = new URL(`https://${siteUrl}`);
      } catch {
        throw new Error('Invalid URL format');
      }
    }

    const baseUrl = `${url.protocol}//${url.host}`;

    // Helper function to create timeout signal
    const createTimeoutSignal = (ms: number) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), ms);
      return controller.signal;
    };

    // Strategy 1: Check common RSS paths
    for (const path of COMMON_RSS_PATHS) {
      try {
        const rssUrl = `${baseUrl}${path}`;
        const response = await fetch(rssUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: createTimeoutSignal(5000) // 5 second timeout
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          // Also try GET to verify it's actually RSS content
          if (contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom') || contentType.includes('text/xml')) {
            // Verify by trying to fetch actual content
            try {
              const contentResponse = await fetch(rssUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                signal: createTimeoutSignal(5000)
              });
              if (contentResponse.ok) {
                const text = await contentResponse.text();
                // Check if it looks like RSS/Atom
                if (text.includes('<rss') || text.includes('<feed') || text.includes('<rdf:RDF')) {
                  return { url: rssUrl };
                }
              }
            } catch {
              // If HEAD says it's RSS, trust it
              return { url: rssUrl };
            }
          }
        }
      } catch {
        // Continue to next path
        continue;
      }
    }

    // Strategy 2: Parse HTML and look for RSS link tags
    try {
      const htmlResponse = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: createTimeoutSignal(10000) // 10 second timeout
      });

      if (htmlResponse.ok) {
        const html = await htmlResponse.text();
        
        // Look for RSS link tags: <link rel="alternate" type="application/rss+xml" href="...">
        const rssLinkMatch = html.match(
          /<link[^>]+rel=["'](alternate|feed)["'][^>]+type=["'][^"']*rss[^"']*["'][^>]+href=["']([^"']+)["']/i
        ) || html.match(
          /<link[^>]+type=["'][^"']*rss[^"']*["'][^>]+rel=["'](alternate|feed)["'][^>]+href=["']([^"']+)["']/i
        );

        if (rssLinkMatch && rssLinkMatch[2]) {
          let rssUrl = rssLinkMatch[2];
          
          // Make absolute URL if relative
          if (rssUrl.startsWith('/')) {
            rssUrl = `${baseUrl}${rssUrl}`;
          } else if (!rssUrl.startsWith('http')) {
            rssUrl = `${baseUrl}/${rssUrl}`;
          }

          // Verify it's actually an RSS feed
          try {
            const verifyResponse = await fetch(rssUrl, {
              method: 'HEAD',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              signal: createTimeoutSignal(5000)
            });

            if (verifyResponse.ok) {
              return { url: rssUrl };
            }
          } catch {
            // Continue
          }
        }

        // Also look for atom feeds
        const atomLinkMatch = html.match(
          /<link[^>]+rel=["']alternate["'][^>]+type=["']application\/atom\+xml["'][^>]+href=["']([^"']+)["']/i
        );

        if (atomLinkMatch && atomLinkMatch[1]) {
          let atomUrl = atomLinkMatch[1];
          
          if (atomUrl.startsWith('/')) {
            atomUrl = `${baseUrl}${atomUrl}`;
          } else if (!atomUrl.startsWith('http')) {
            atomUrl = `${baseUrl}/${atomUrl}`;
          }

          try {
            const verifyResponse = await fetch(atomUrl, {
              method: 'HEAD',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              signal: createTimeoutSignal(5000)
            });

            if (verifyResponse.ok) {
              return { url: atomUrl };
            }
          } catch {
            // Continue
          }
        }
      }
    } catch (error) {
      console.error('Error parsing HTML for RSS links:', error);
    }

    // Strategy 3: Try WordPress default feed (most common)
    try {
      const wpFeedUrl = `${baseUrl}/feed/`;
      const response = await fetch(wpFeedUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: createTimeoutSignal(5000)
      });

      if (response.ok) {
        return { url: wpFeedUrl };
      }
    } catch {
      // Continue
    }

    return null;
  } catch (error: any) {
    console.error('Error finding RSS feed:', error);
    throw new Error(`Failed to find RSS feed: ${error.message}`);
  }
}

/**
 * Validate if a URL is a valid RSS feed
 */
export async function validateRSSFeed(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom');
  } catch {
    return false;
  }
}
