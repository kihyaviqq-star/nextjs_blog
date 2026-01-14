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
 * Normalize IPv4 address (handles incomplete formats like 127.1 -> 127.0.0.1)
 */
function normalizeIPv4(ip: string): string {
  const parts = ip.split('.');
  if (parts.length < 4) {
    // Pad with zeros: 127.1 -> 127.1.0.0 -> 127.0.0.1
    while (parts.length < 4) {
      parts.push('0');
    }
    // Reorder: last part becomes the last octet
    if (parts.length === 2) {
      // 127.1 -> 127.0.0.1
      return `${parts[0]}.0.0.${parts[1]}`;
    } else if (parts.length === 3) {
      // 127.0.1 -> 127.0.0.1
      return `${parts[0]}.${parts[1]}.0.${parts[2]}`;
    }
  }
  return ip;
}

/**
 * Normalize IPv6 address (handles compressed formats)
 */
function normalizeIPv6(ip: string): string {
  const lowerIp = ip.toLowerCase().trim();
  
  // Handle IPv4-mapped IPv6: ::ffff:127.0.0.1 or ::ffff:7f00:1
  if (lowerIp.startsWith('::ffff:')) {
    const ipv4Part = lowerIp.substring(7);
    // Check if it's hex format (7f00:1) or decimal (127.0.0.1)
    if (ipv4Part.includes(':')) {
      // Hex format: convert to decimal
      const hexParts = ipv4Part.split(':');
      if (hexParts.length === 2) {
        const part1 = parseInt(hexParts[0], 16);
        const part2 = parseInt(hexParts[1], 16);
        return `${Math.floor(part1 / 256)}.${part1 % 256}.${Math.floor(part2 / 256)}.${part2 % 256}`;
      }
    }
    return normalizeIPv4(ipv4Part);
  }
  
  return lowerIp;
}

/**
 * SSRF Protection: Check if IP is private
 * Supports IPv4 and IPv6 with normalization
 */
function isPrivateIP(ip: string): boolean {
  // Normalize the IP first
  let normalizedIp = ip.trim();
  
  // Check if it's IPv6
  if (normalizedIp.includes(':')) {
    normalizedIp = normalizeIPv6(normalizedIp);
  } else {
    // IPv4
    normalizedIp = normalizeIPv4(normalizedIp);
  }
  
  // IPv4 check
  const ipv4Parts = normalizedIp.split('.');
  if (ipv4Parts.length === 4) {
    const parts = ipv4Parts.map(Number);
    
    // Validate all parts are numbers
    if (parts.some(isNaN)) return false;
    
    // 127.0.0.0/8 (localhost)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (private)
    if (parts[0] === 10) return true;
    // 192.168.0.0/16 (private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 172.16.0.0/12 (private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 0.0.0.0/8 (this network)
    if (parts[0] === 0) return true;
    // 169.254.0.0/16 (link-local)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 224.0.0.0/4 (multicast)
    if (parts[0] >= 224 && parts[0] <= 239) return true;
    // 240.0.0.0/4 (reserved)
    if (parts[0] >= 240 && parts[0] <= 255) return true;
  }

  // IPv6 check (after normalization)
  const originalIp = ip.toLowerCase().trim();
  if (originalIp.includes(':')) {
    // ::1 (localhost)
    if (originalIp === '::1' || originalIp === '0:0:0:0:0:0:0:1') return true;
    // fc00::/7 (unique local) - check first 2 hex digits
    const firstTwoHex = originalIp.substring(0, 2);
    if (firstTwoHex === 'fc' || firstTwoHex === 'fd') return true;
    // fe80::/10 (link-local) - check first 3 hex digits
    const firstThreeHex = originalIp.substring(0, 3);
    if (firstThreeHex === 'fe8' || firstThreeHex === 'fe9' || 
        firstThreeHex === 'fea' || firstThreeHex === 'feb') return true;
    // ::ffff:0.0.0.0/96 (IPv4-mapped) - already handled in normalizeIPv6
    if (originalIp.startsWith('::ffff:')) {
      const ipv4Part = originalIp.substring(7);
      // If it's still IPv6 format after extraction, it's likely mapped
      if (!ipv4Part.includes(':')) {
        return isPrivateIP(ipv4Part);
      }
    }
  }

  return false;
}

/**
 * SSRF Protection: Validate URL and check IP before fetch
 */
async function validateUrlForSSRF(urlString: string): Promise<void> {
  let url: URL;
  
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid URL format');
  }

  // 1. Разрешить только HTTP и HTTPS
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Invalid protocol: ${url.protocol}. Only HTTP and HTTPS are allowed.`);
  }

  // 2. DNS lookup для получения IP адреса
  const { lookup } = await import('dns/promises');
  
  try {
    const { address } = await lookup(url.hostname, { all: false });
    
    // 3. Проверка на приватный IP
    if (isPrivateIP(address)) {
      throw new Error(`Access denied: URL resolves to private IP address ${address}`);
    }
  } catch (error: any) {
    // Если ошибка уже содержит наше сообщение - пробрасываем дальше
    if (error.message && error.message.includes('Access denied')) {
      throw error;
    }
    // Если DNS lookup не удался - блокируем запрос
    throw new Error(`Failed to resolve hostname ${url.hostname}: ${error.message || 'DNS lookup failed'}`);
  }
}

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

    // SSRF Protection: Validate URL and check IP before any fetch
    await validateUrlForSSRF(url.toString());

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
        
        // SSRF Protection: Validate each URL before fetch
        await validateUrlForSSRF(rssUrl);
        
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
                // SSRF Protection: URL уже проверен выше, но для безопасности проверяем снова
                // (на случай если rssUrl был изменен)
                await validateUrlForSSRF(rssUrl);
                
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
      // SSRF Protection: baseUrl уже проверен, но проверяем снова для безопасности
      await validateUrlForSSRF(baseUrl);
      
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
            // SSRF Protection: Validate URL before fetch
            await validateUrlForSSRF(rssUrl);
            
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
            // SSRF Protection: Validate URL before fetch
            await validateUrlForSSRF(atomUrl);
            
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
      
      // SSRF Protection: Validate URL before fetch
      await validateUrlForSSRF(wpFeedUrl);
      
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
    // SSRF Protection: Validate URL before fetch
    await validateUrlForSSRF(url);
    
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
