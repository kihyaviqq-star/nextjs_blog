
'use server';

// Примечание: maxDuration должен экспортироваться из layout.tsx или page.tsx (Server Components),
// а не из файлов с 'use server'. См. app/dashboard/generator/layout.tsx

import { fetchNewsFromSources, NewsItem, getAllSources } from '@/lib/news-fetcher';
import { scrapeUrl } from '@/lib/url-scraper';
import { generateArticle, GeneratedArticle } from '@/lib/ai-client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { generateSlug, generateUniqueSlug } from '@/lib/slug';
import fs from 'fs/promises';
import path from 'path';
import { lookup } from 'dns/promises';
import { z } from 'zod';
import rateLimit from '@/lib/rate-limit';

// Rate limiters для разных операций
const aiGenerationLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

const imageGenerationLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

const MAX_DOWNLOADED_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_IMAGE_HOSTS = ['image.pollinations.ai', 'openrouter.ai'];

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;

  if (parts[0] === 127) return true;
  if (parts[0] === 10) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 0) return true;

  return false;
}

function resolveAllowedImageHosts(): Set<string> {
  const envHosts = process.env.ALLOWED_IMAGE_HOSTS
    ? process.env.ALLOWED_IMAGE_HOSTS.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)
    : [];

  return new Set([...DEFAULT_ALLOWED_IMAGE_HOSTS, ...envHosts]);
}

async function validateImageDownloadUrl(url: string): Promise<void> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Invalid image URL');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Only HTTPS image URLs are allowed');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const allowedHosts = resolveAllowedImageHosts();
  if (!allowedHosts.has(hostname)) {
    throw new Error(`Image host is not allowed: ${hostname}`);
  }

  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    throw new Error('Local hostnames are not allowed');
  }

  const { address } = await lookup(hostname);
  if (address.includes(':')) {
    // Basic IPv6 deny for loopback and unique-local ranges.
    const normalized = address.toLowerCase();
    if (normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80')) {
      throw new Error('Resolved IPv6 address is private');
    }
    return;
  }

  if (isPrivateIPv4(address)) {
    throw new Error('Resolved IPv4 address is private');
  }
}

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
      const allSources = await getAllSources();
      sourcesToFetch = allSources.filter(s => s.enabled !== false).map(s => s.id);
      console.log('Defaulting to all enabled sources');
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
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    // Проверка роли через запрос к БД (только ADMIN/EDITOR могут парсить URL)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
      return { success: false, error: 'Forbidden: Insufficient permissions' };
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return { success: false, error: 'Invalid URL format' };
    }

    // Use AI parsing by default for better content extraction with images
    // But first try traditional fetch, if it fails then use AI
    const useAI = process.env.USE_AI_PARSING !== 'false'; // Default to true unless explicitly disabled
    
    console.log(`[parseUrlAction] Parsing URL: ${url}, useAI: ${useAI}`);
    const startTime = Date.now();
    
    try {
      // First try with AI direct browsing (bypasses fetch issues)
      // If that's too slow or fails, fall back to fetch + AI or traditional
      const scraped = await scrapeUrl(url, useAI);
      const elapsed = Date.now() - startTime;
      console.log(`[parseUrlAction] Successfully parsed URL in ${elapsed}ms`);
      return { success: true, data: scraped };
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      console.error(`[parseUrlAction] Failed after ${elapsed}ms:`, error.message);
      // If AI parsing fails or times out, try traditional parsing as fallback
      if (useAI && error.message?.includes('timeout')) {
        console.log('[parseUrlAction] AI timeout, trying traditional parsing...');
        try {
          const scraped = await scrapeUrl(url, false); // Disable AI for this attempt
          console.log(`[parseUrlAction] Traditional parsing succeeded in ${Date.now() - startTime}ms`);
          return { success: true, data: scraped };
        } catch (fallbackError: any) {
          return { success: false, error: fallbackError.message || 'Failed to scrape URL' };
        }
      }
      return { success: false, error: error.message || 'Failed to scrape URL' };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to scrape URL' };
  }
}

export async function generateArticleFromUrlAction(url: string): Promise<{ success: boolean; data?: GeneratedArticle; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user || !session.user.email) {
      return { success: false, error: 'Unauthorized' };
    }

    // Rate limiting (10 запросов в минуту)
    try {
      await aiGenerationLimiter.check(10, `ai-gen-url-${session.user.email}`);
    } catch {
      return { 
        success: false, 
        error: 'Too many requests. Please wait before generating another article. Limit: 10 requests per minute.' 
      };
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

// Zod схема для валидации входных данных
const generateArticleSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500, 'Topic must be at most 500 characters'),
  context: z.string().min(1, 'Context is required').max(50000, 'Context must be at most 50000 characters'),
});

export async function generateArticleAction(topic: string, context: string): Promise<{ success: boolean; data?: GeneratedArticle; error?: string }> {
  try {
    // 1. Проверка сессии
    const session = await auth();
    if (!session?.user || !session.user.email) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Rate limiting (10 запросов в минуту)
    try {
      await aiGenerationLimiter.check(10, `ai-gen-${session.user.email}`);
    } catch {
      return { 
        success: false, 
        error: 'Too many requests. Please wait before generating another article. Limit: 10 requests per minute.' 
      };
    }

    // 3. Проверка роли через запрос к БД
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
      return { success: false, error: 'Forbidden: Insufficient permissions' };
    }

    // 3. Валидация входных параметров через Zod
    try {
      generateArticleSchema.parse({ topic, context });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const firstError = validationError.issues[0];
        return { 
          success: false, 
          error: firstError?.message || 'Invalid input parameters' 
        };
      }
      return { success: false, error: 'Invalid input parameters' };
    }

    // Генерация статьи
    const article = await generateArticle(topic, context);
    return { success: true, data: article };
  } catch (error: any) {
    // 4. Обработка ошибок для production
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Логируем детальную ошибку только в development
    if (!isProduction) {
      console.error('generateArticleAction error:', error);
    }

    // Возвращаем безопасное сообщение в production
    return { 
      success: false, 
      error: isProduction 
        ? 'Failed to generate article. Please try again later.' 
        : (error.message || 'Generation failed')
    };
  }
}

export async function generateImageAction(topic: string, summary: string): Promise<{ success: boolean; imageUrl?: string; prompt?: string; error?: string }> {
  try {
    // Rate limiting (10 запросов в минуту для генерации изображений)
    const session = await auth();
    if (!session?.user || !session.user.email) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      await imageGenerationLimiter.check(10, `img-gen-${session.user.email}`);
    } catch {
      return { 
        success: false, 
        error: 'Too many requests. Please wait before generating another image. Limit: 10 requests per minute.' 
      };
    }

    const { generateImagePrompt, generateImage } = await import('@/lib/ai-client');
    const prompt = await generateImagePrompt(topic, summary);
    const imageUrl = await generateImage(prompt);
    
    let buffer: Buffer;
    
    // Handle base64 data URLs
    if (imageUrl.startsWith('data:image/')) {
      const base64Data = imageUrl.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // Download image from URL with SSRF and size/content checks
      await validateImageDownloadUrl(imageUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(imageUrl, {
        signal: controller.signal,
        redirect: 'error',
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to download image');

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().startsWith('image/')) {
        throw new Error('Downloaded content is not an image');
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        const size = Number.parseInt(contentLength, 10);
        if (!Number.isNaN(size) && size > MAX_DOWNLOADED_IMAGE_SIZE) {
          throw new Error('Downloaded image is too large');
        }
      }
      
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_DOWNLOADED_IMAGE_SIZE) {
        throw new Error('Downloaded image exceeds size limit');
      }

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

    // Use slug from article if provided, otherwise generate from title
    let finalSlug = article.slug || generateSlug(article.title);
    
    // Ensure uniqueness - check if slug already exists
    const { generateUniqueSlug } = await import('@/lib/slug');
    finalSlug = await generateUniqueSlug(
      finalSlug,
      async (slugToCheck) => {
        const exists = await prisma.post.findUnique({ where: { slug: slugToCheck } });
        return !!exists;
      }
    );

    // Сохраняем в БД
    await prisma.post.create({
      data: {
        title: article.title,
        slug: finalSlug,
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
