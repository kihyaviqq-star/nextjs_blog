import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/error-handler";
import { MAX_JSON_BODY_SIZE } from "@/lib/validations";

// GET - Fetch site settings
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create default settings
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.siteSettings.create({
        data: {
          id: "default",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    const { message, status } = handleApiError(error, "API GET settings");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// PUT - Update site settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Проверка роли через запрос к БД (безопаснее, чем из сессии)
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only ADMIN can update settings
    if (dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Проверка реального размера тела запроса
    const bodySize = JSON.stringify(body).length;
    if (bodySize > MAX_JSON_BODY_SIZE) {
      return NextResponse.json(
        { error: `Request body too large. Maximum size is ${MAX_JSON_BODY_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    const { siteName, logoUrl, faviconUrl, metaDescription, footerText, homeSubtitle } = body;

    // Update or create settings
    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {
        siteName,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        metaDescription: metaDescription || null,
        footerText: footerText || null,
        homeSubtitle: homeSubtitle || null,
      },
      create: {
        id: "default",
        siteName,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        metaDescription: metaDescription || null,
        footerText: footerText || null,
        homeSubtitle: homeSubtitle || null,
      },
    });

    // Инвалидируем кеш для обновления данных на всех страницах
    // Инвалидируем layout для обновления метаданных, favicon и всего Header
    revalidatePath('/', 'layout');
    // Инвалидируем главную страницу
    revalidatePath('/');
    // Инвалидируем страницу настроек
    revalidatePath('/dashboard/settings');
    // Инвалидируем все страницы статей (динамические пути)
    revalidatePath('/[slug]', 'page');

    return NextResponse.json(settings);
  } catch (error) {
    const { message, status } = handleApiError(error, "API PUT settings");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
