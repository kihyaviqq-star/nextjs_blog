
'use server';

import { fetchNewsFromSources, NewsItem, RSS_SOURCES } from '@/lib/news-fetcher';
import { scrapeUrl } from '@/lib/url-scraper';
import { generateArticle, GeneratedArticle } from '@/lib/ai-client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

export async function getNewsAction(enabledSourceIds?: string[]): Promise<{ success: boolean; data?: NewsItem[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    console.log('getNewsAction called with:', enabledSourceIds, 'Type:', typeof enabledSourceIds, 'IsArray:', Array.isArray(enabledSourceIds));
    
    // Explicitly handle undefined/null to default to all sources
    // If empty array is passed, it means "no sources", so we respect it.
    let sourcesToFetch: string[];
    
    if (enabledSourceIds === undefined || enabledSourceIds === null) {
      sourcesToFetch = RSS_SOURCES.map(s => s.id);
      console.log('Defaulting to all sources');
    } else {
      sourcesToFetch = enabledSourceIds;
    }
    
    console.log('Fetching sources:', sourcesToFetch);
    const news = await fetchNewsFromSources(sourcesToFetch);
    return { success: true, data: news };
  } catch (error: any) {
    console.error('getNewsAction error:', error);
    return { success: false, error: error.message || 'Failed to fetch news' };
  }
}

export async function parseUrlAction(url: string): Promise<{ success: boolean; data?: { title: string; content: string; url: string }; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return { success: false, error: 'Invalid URL format' };
    }

    const scraped = await scrapeUrl(url);
    return { success: true, data: scraped };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to scrape URL' };
  }
}

export async function generateArticleFromUrlAction(url: string): Promise<{ success: boolean; data?: GeneratedArticle; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // First scrape the URL
    const scrapeResult = await parseUrlAction(url);
    if (!scrapeResult.success || !scrapeResult.data) {
      throw new Error(scrapeResult.error || 'Failed to scrape URL');
    }

    // Generate article from scraped content
    const article = await generateArticle(scrapeResult.data.title, scrapeResult.data.content);
    return { success: true, data: article };
  } catch (error: any) {
    return { success: false, error: error.message || 'Generation failed' };
  }
}

export async function generateArticleAction(topic: string, context: string): Promise<{ success: boolean; data?: GeneratedArticle; error?: string }> {
  try {
    const article = await generateArticle(topic, context);
    return { success: true, data: article };
  } catch (error: any) {
    return { success: false, error: error.message || 'Generation failed' };
  }
}

export async function generateImageAction(topic: string, summary: string): Promise<{ success: boolean; imageUrl?: string; prompt?: string; error?: string }> {
  try {
    const { generateImagePrompt, generateImage } = await import('@/lib/ai-client');
    const prompt = await generateImagePrompt(topic, summary);
    const imageUrl = await generateImage(prompt);
    
    let buffer: Buffer;
    
    // Handle base64 data URLs
    if (imageUrl.startsWith('data:image/')) {
      const base64Data = imageUrl.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // Download image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to download image');
      
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
    
    // Create unique filename
    const filename = `cover-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure directory exists
    try {
        await fs.mkdir(publicDir, { recursive: true });
    } catch (e) {
        // Ignore if exists
    }

    const filePath = path.join(publicDir, filename);
    await fs.writeFile(filePath, buffer);
    
    const localImageUrl = `/uploads/${filename}`;

    return { success: true, imageUrl: localImageUrl, prompt };
  } catch (error: any) {
    return { success: false, error: error.message || 'Image generation failed' };
  }
}

export async function publishArticleAction(article: GeneratedArticle): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
      return { success: false, error: 'Forbidden: Insufficient permissions' };
    }

    // Extract first paragraph for excerpt (strip HTML tags)
    const firstParagraph = article.blocks.find(b => b.type === 'paragraph');
    const excerptText = firstParagraph?.data?.text 
      ? firstParagraph.data.text.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
      : '';

    // Сохраняем в БД
    await prisma.post.create({
      data: {
        title: article.title,
        slug: article.slug + '-' + Date.now(), // Ensure uniqueness
        // The article.blocks is already an array of blocks, we need to wrap it in the EditorJS structure
        content: JSON.stringify({
          time: Date.now(),
          blocks: article.blocks,
          version: '2.29.1'
        }),
        excerpt: excerptText,
        tags: JSON.stringify(article.tags),
        coverImage: article.coverImage || null,
        readTime: '5 мин', // Placeholder
        authorId: user.id,
        publishedAt: new Date(),
      }
    });
    
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Publish error:', error);
    return { success: false, error: error.message || 'Failed to publish' };
  }
}
