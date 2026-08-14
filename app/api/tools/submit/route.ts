import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import rateLimit from "@/lib/rate-limit";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";
import { z } from "zod";

const submitToolSchema = z.object({
  name: z.string().min(2, "Название слишком короткое").max(100),
  websiteUrl: z.string().url("Укажите корректный URL сайта"),
  shortDesc: z.string().min(10, "Описание слишком короткое").max(300),
  description: z.string().min(20, "Полное описание должно быть не менее 20 символов"),
  categoryId: z.string().min(1, "Выберите категорию"),
  pricing: z.enum(["Free", "Freemium", "Paid", "Free Trial", "Open Source"]).default("Free"),
  isAi: z.boolean().default(true),
  platforms: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const limiter = rateLimit({
  interval: 600 * 1000,
  uniqueTokenPerInterval: 500,
});

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    
    // Rate limit submissions: max 5 per 10 minutes per IP
    try {
      await limiter.check(5, `submit-tool:${ip}`);
    } catch {
      return NextResponse.json(
        { error: "Слишком много заявок. Пожалуйста, подождите несколько минут." },
        { status: 429 }
      );
    }

    const session = await auth();
    const body = await req.json();
    const validated = submitToolSchema.parse(body);

    // Verify category exists
    const category = await prisma.softwareCategory.findUnique({
      where: { id: validated.categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: "Указанная категория не найдена" }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = generateSlug(validated.name) || `tool-${Date.now()}`;
    const slug = await generateUniqueSlug(baseSlug, async (s) => {
      const existing = await prisma.software.findUnique({ where: { slug: s } });
      return !!existing;
    });

    // Fetch favicon / domain info if possible
    let logoUrl: string | null = null;
    try {
      const parsedUrl = new URL(validated.websiteUrl);
      logoUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`;
    } catch {
      // ignore
    }

    // Save with status PENDING
    const newTool = await prisma.software.create({
      data: {
        slug,
        name: validated.name,
        shortDesc: validated.shortDesc,
        description: validated.description,
        websiteUrl: validated.websiteUrl,
        logoUrl,
        pricing: validated.pricing,
        isAi: validated.isAi,
        categoryId: validated.categoryId,
        platforms: validated.platforms ? JSON.stringify(validated.platforms) : JSON.stringify(["Web"]),
        tags: validated.tags ? JSON.stringify(validated.tags) : JSON.stringify([]),
        status: "PENDING",
        submittedBy: session?.user?.name || session?.user?.email || "Анонимный пользователь",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Инструмент успешно отправлен на модерацию!",
      toolId: newTool.id,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Ошибка валидации" }, { status: 400 });
    }
    console.error("POST /api/tools/submit error:", error);
    return NextResponse.json({ error: "Не удалось отправить инструмент" }, { status: 500 });
  }
}
