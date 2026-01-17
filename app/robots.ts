import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Get base URL from environment variable or fallback
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Check if indexing is allowed (default: false - site is closed from indexing)
  const allowIndexing = process.env.ALLOW_INDEXING === 'true';

  // If indexing is disabled, block all crawlers
  if (!allowIndexing) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/', // Block all pages
        },
      ],
      // Don't provide sitemap when blocking indexing
    };
  }

  // If indexing is enabled, use normal rules
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/auth/',
          '/settings',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
