import { prisma } from "@/lib/prisma";

/**
 * Создает или обновляет редирект при изменении slug статьи
 * Также обновляет существующие редиректы, которые вели на старый slug, чтобы избежать цепочек
 * 
 * @param oldSlug - Старый slug статьи
 * @param newSlug - Новый slug статьи
 */
export async function createRedirect(oldSlug: string, newSlug: string): Promise<void> {
  if (oldSlug === newSlug) {
    return; // Не создаем редирект, если slug не изменился
  }

  try {
    // Проверяем, существует ли модель Redirect в Prisma Client
    if (!prisma.redirect) {
      console.warn('[createRedirect] Redirect model not available. Please run: npx prisma generate');
      return;
    }

    // Находим все редиректы, которые вели на старый slug
    const redirectsToOldSlug = await prisma.redirect.findMany({
      where: { toSlug: oldSlug }
    });

    // Обновляем их, чтобы они вели на новый slug (разрываем цепочки)
    if (redirectsToOldSlug.length > 0) {
      await prisma.redirect.updateMany({
        where: { toSlug: oldSlug },
        data: { toSlug: newSlug }
      });
    }

    // Проверяем, существует ли уже редирект с таким fromSlug
    const existingRedirect = await prisma.redirect.findUnique({
      where: { fromSlug: oldSlug }
    });

    if (existingRedirect) {
      // Обновляем существующий редирект
      await prisma.redirect.update({
        where: { fromSlug: oldSlug },
        data: { toSlug: newSlug }
      });
    } else {
      // Создаем новый редирект
      await prisma.redirect.create({
        data: {
          fromSlug: oldSlug,
          toSlug: newSlug
        }
      });
      console.log(`[createRedirect] Redirect created: ${oldSlug} -> ${newSlug}`);
    }
  } catch (error: any) {
    // Если модель Redirect не существует или произошла другая ошибка БД
    if (error?.code === 'P2001' || error?.message?.includes('redirect') || error?.message?.includes('findMany')) {
      console.warn('[createRedirect] Redirect table not found. Please apply migration:', error.message);
      return;
    }
    // Пробрасываем другие ошибки
    throw error;
  }
}

/**
 * Находит финальный slug, разрешая цепочки редиректов
 * @param slug - Начальный slug
 * @returns Финальный slug или null, если редирект не найден
 */
export async function resolveRedirect(slug: string): Promise<string | null> {
  try {
    // Проверяем, существует ли модель Redirect в Prisma Client
    if (!prisma.redirect) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[resolveRedirect] Redirect model not available');
      }
      return null;
    }

    const visited = new Set<string>();
    let currentSlug = slug;

    // Защита от бесконечных циклов (максимум 10 переходов)
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      if (visited.has(currentSlug)) {
        // Обнаружен цикл, возвращаем текущий slug
        console.log(`[resolveRedirect] Cycle detected for slug: ${slug}`);
        return currentSlug;
      }

      visited.add(currentSlug);

      const redirect = await prisma.redirect.findUnique({
        where: { fromSlug: currentSlug }
      });

      if (!redirect) {
        // Редирект не найден
        if (iterations === 0) {
          // Первая итерация - редирект точно не найден
          return null;
        }
        // Последующие итерации в цепочке - возвращаем текущий slug
        return currentSlug;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`[resolveRedirect] Found redirect: ${currentSlug} -> ${redirect.toSlug}`);
      }
      currentSlug = redirect.toSlug;
      iterations++;
    }

    // Если достигнут лимит итераций, возвращаем текущий slug из цепочки
    if (process.env.NODE_ENV === 'development') {
      console.log(`[resolveRedirect] Max iterations reached for slug: ${slug}, final: ${currentSlug}`);
    }
    return currentSlug;
  } catch (error: any) {
    // Если модель Redirect не существует, возвращаем null
    if (process.env.NODE_ENV === 'development') {
      console.error(`[resolveRedirect] Error:`, error?.message || error);
    }
    if (error?.code === 'P2001' || error?.message?.includes('redirect')) {
      return null;
    }
    // Пробрасываем другие ошибки
    throw error;
  }
}
