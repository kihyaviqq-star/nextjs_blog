import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Простое in-memory кеширование для редиректов (можно заменить на Redis в продакшене)
// ВАЖНО: Кеш может показывать устаревшие данные, поэтому TTL короткий
const redirectCache = new Map<string, { toSlug: string; timestamp: number } | null>();
const CACHE_TTL = 5 * 1000; // 5 секунд для быстрого обновления

async function checkRedirect(slug: string): Promise<string | null> {
  // Проверяем кеш (но только если там есть положительный результат)
  // Не кешируем отрицательные результаты (отсутствие редиректа), 
  // чтобы новые редиректы были видны сразу
  const cached = redirectCache.get(slug);
  if (cached && cached !== null && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.toSlug;
  }

  // Динамически импортируем prisma только при необходимости
  try {
    const { prisma } = await import('@/lib/prisma');
    
    // Проверяем, существует ли статья с таким slug
    // Если существует, не проверяем редирект (статья имеет приоритет)
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (post) {
      // Статья найдена, редирект не нужен
      return null;
    }
    
    // Статья не найдена, проверяем редиректы
    const redirect = await prisma.redirect.findUnique({
      where: { fromSlug: slug },
      select: { toSlug: true }
    });

    if (redirect) {
      // Сохраняем в кеш только положительные результаты
      redirectCache.set(slug, { toSlug: redirect.toSlug, timestamp: Date.now() });
      return redirect.toSlug;
    }
    
    // НЕ кешируем отсутствие редиректа, чтобы новые редиректы были видны сразу
  } catch (error: any) {
    // В случае ошибки пропускаем запрос дальше (без логирования в продакшене)
    if (process.env.NODE_ENV === 'development') {
      console.error('[Middleware] Error checking redirect:', error?.message || error);
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Пропускаем системные маршруты
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Извлекаем slug из пути (убираем начальный /)
  const slug = decodeURIComponent(pathname.slice(1));

  if (!slug) {
    return NextResponse.next();
  }

  // Проверяем редиректы (оптимизировано с кешированием)
  const redirectTo = await checkRedirect(slug);

  if (redirectTo) {
    // Найден редирект, делаем постоянный редирект 308
    console.log(`[Middleware] Redirecting ${slug} -> ${redirectTo}`);
    const newUrl = new URL(`/${encodeURIComponent(redirectTo)}`, request.url);
    return NextResponse.redirect(newUrl, { status: 308 });
  } else {
    console.log(`[Middleware] No redirect found for slug: "${slug}"`);
  }

  // Если редирект не найден, пропускаем запрос дальше
  // (проверка статьи и профиля пользователя будет в page.tsx)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|dashboard|auth).*)',
  ],
};
