import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { findRSSFeed } from '@/lib/rss-finder';
import { createRSSSourceSchema, validateBodySize, formatZodError, MAX_JSON_BODY_SIZE } from '@/lib/validations';
import rateLimit from '@/lib/rate-limit';
import { handleApiError } from '@/lib/error-handler';

// Rate limiter для добавления RSS источников (20 запросов в минуту)
const rssSourceLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// GET - получить все источники
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = user.role;
    if (userRole !== 'ADMIN' && userRole !== 'EDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if RSSSource model exists in Prisma Client
    if (!prisma.rSSSource) {
      console.error('RSSSource model not found in Prisma Client. Keys:', Object.keys(prisma));
      // Fallback check for different casing
      // @ts-ignore
      if (prisma.RSSSource) {
        console.log('Found RSSSource as prisma.RSSSource');
        // @ts-ignore
        prisma.rSSSource = prisma.RSSSource;
      } else if (prisma.rssSource) {
        console.log('Found rssSource as prisma.rssSource');
        // @ts-ignore
        prisma.rSSSource = prisma.rssSource;
      } else {
        return NextResponse.json(
            { error: 'Database model not initialized. Please restart the server.' },
            { status: 500 }
        );
      }
    }

    const sources = await prisma.rSSSource.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ sources });
  } catch (error: any) {
    const { message, status } = handleApiError(error, "API GET RSS sources");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// POST - добавить новый источник
export async function POST(request: NextRequest) {
  try {
    // 1. Проверка авторизации (нужна для rate limiting по email)
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate limiting (20 запросов в минуту по email пользователя)
    try {
      await rssSourceLimiter.check(20, `rss-source-${session.user.email}`);
    } catch {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Maximum 20 requests per minute for adding RSS sources.'
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = user.role;
    if (userRole !== 'ADMIN' && userRole !== 'EDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Проверка размера тела запроса
    const contentLength = request.headers.get('content-length');
    const sizeValidation = validateBodySize(contentLength);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 400 }
      );
    }

    // 2. Парсинг и валидация тела запроса
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // 3. Проверка реального размера тела запроса
    const bodySize = JSON.stringify(body).length;
    if (bodySize > MAX_JSON_BODY_SIZE) {
      return NextResponse.json(
        { error: `Request body too large. Maximum size is ${MAX_JSON_BODY_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // 4. Валидация через Zod
    const validationResult = createRSSSourceSchema.safeParse(body);
    if (!validationResult.success) {
      const formattedError = formatZodError(validationResult.error);
      return NextResponse.json(
        formattedError,
        { status: 400 }
      );
    }

    const { name, url } = validationResult.data;

    // Validate URL format (Zod уже проверил, но для RSS finder нужен полный URL)
    let siteUrl: string;
    try {
      const urlObj = new URL(url);
      siteUrl = url;
    } catch {
      // Try adding https:// if no protocol
      try {
        const urlObj = new URL(`https://${url}`);
        siteUrl = urlObj.toString();
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Find RSS feed automatically
    let rssFeedUrl: string;
    try {
      const rssFeed = await findRSSFeed(siteUrl);
      if (!rssFeed || !rssFeed.url) {
        return NextResponse.json(
          { error: 'RSS feed not found on this website. Please provide a direct RSS feed URL.' },
          { status: 404 }
        );
      }
      rssFeedUrl = rssFeed.url;
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to find RSS feed' },
        { status: 500 }
      );
    }

    // Generate name from URL if not provided
    let sourceName = name?.trim();
    if (!sourceName) {
      try {
        const urlObj = new URL(siteUrl);
        sourceName = urlObj.hostname.replace('www.', '');
      } catch {
        sourceName = 'RSS Feed';
      }
    }

    // Ensure prisma.rSSSource exists (fix for potential casing issues or stale client)
    if (!prisma.rSSSource) {
      console.error('RSSSource model not found in Prisma Client (POST). Keys:', Object.keys(prisma));
      // @ts-ignore
      if (prisma.RSSSource) {
        // @ts-ignore
        prisma.rSSSource = prisma.RSSSource;
      } else if (prisma.rssSource) {
        // @ts-ignore
        prisma.rSSSource = prisma.rssSource;
      } else {
        return NextResponse.json(
            { error: 'Database model not initialized. Please restart the server.' },
            { status: 500 }
        );
      }
    }

    // Check if RSS feed URL already exists
    const existing = await prisma.rSSSource.findUnique({
      where: { url: rssFeedUrl }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This RSS feed is already added' },
        { status: 409 }
      );
    }

    const source = await prisma.rSSSource.create({
      data: {
        name: sourceName,
        url: rssFeedUrl,
        enabled: true,
        isDefault: false
      }
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error: any) {
    const { message, status } = handleApiError(error, "API POST RSS source");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
