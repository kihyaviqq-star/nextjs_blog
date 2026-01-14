import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { findRSSFeed } from '@/lib/rss-finder';

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
      console.error('RSSSource model not found in Prisma Client. Please run: npx prisma generate');
      return NextResponse.json({ sources: [] });
    }

    const sources = await prisma.rSSSource.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ sources });
  } catch (error: any) {
    console.error('Error fetching RSS sources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}

// POST - добавить новый источник
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
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
    console.error('Error creating RSS source:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create source' },
      { status: 500 }
    );
  }
}
