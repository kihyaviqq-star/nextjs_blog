
'use server';

import { fetchMicrosoftNews, NewsItem } from '@/lib/news-fetcher';
import { generateArticle, GeneratedArticle } from '@/lib/ai-client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth'; // Assuming auth is available here
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

export async function getNewsAction(): Promise<{ success: boolean; data?: NewsItem[]; error?: string }> {
  try {
    const news = await fetchMicrosoftNews();
    return { success: true, data: news };
  } catch (error) {
    return { success: false, error: 'Failed to fetch news' };
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
    
    // Download image and save locally
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to download image');
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
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
        excerpt: article.blocks.find(b => b.type === 'paragraph')?.data?.text?.substring(0, 150) + '...' || '',
        tags: JSON.stringify(article.tags),
        coverImage: article.coverImage,
        readTime: '5 мин', // Placeholder
        authorId: user.id,
        publishedAt: new Date(),
      }
    });
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Publish error:', error);
    return { success: false, error: error.message || 'Failed to publish' };
  }
}
