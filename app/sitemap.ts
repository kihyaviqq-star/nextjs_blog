import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Check if indexing is allowed (default: false - site is closed from indexing)
  const allowIndexing = process.env.ALLOW_INDEXING === 'true';

  // If indexing is disabled, return empty sitemap
  if (!allowIndexing) {
    return [];
  }

  // Get base URL from environment variable or fallback
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Fetch all published posts from database
  const posts = await prisma.post.findMany({
    select: {
      slug: true,
      updatedAt: true,
      publishedAt: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
  });

  // Generate sitemap entries for posts
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: post.updatedAt || post.publishedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Base URL entry (home page)
  const homeEntry: MetadataRoute.Sitemap[0] = {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0,
  };

  // Combine all entries
  return [homeEntry, ...postEntries];
}
