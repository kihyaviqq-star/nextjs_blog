import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema, validateBodySize, formatZodError, MAX_JSON_BODY_SIZE } from "@/lib/validations";
import { handleApiError } from "@/lib/error-handler";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";

// GET all posts
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { publishedAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Parse JSON fields for client with safe error handling
    const postsWithParsedFields = posts.map((post) => {
      let tags: string[] = [];
      let content: any = { blocks: [] };
      
      try {
        tags = JSON.parse(post.tags) || [];
      } catch (error) {
        console.error('[API GET posts] Error parsing tags:', error);
        tags = [];
      }
      
      try {
        content = JSON.parse(post.content) || { blocks: [] };
      } catch (error) {
        console.error('[API GET posts] Error parsing content:', error);
        content = { blocks: [] };
      }
      
      return {
        ...post,
        tags,
        content,
      };
    });

    return NextResponse.json(postsWithParsedFields);
  } catch (error) {
    const { message, status } = handleApiError(error, "API GET posts");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// POST create new post
export async function POST(request: NextRequest) {
  try {
    // 1. Проверка размера тела запроса (предварительная по заголовку)
    // Пропускаем проверку, если content-length отсутствует (chunked encoding)
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const sizeValidation = validateBodySize(contentLength);
      if (!sizeValidation.valid) {
        return NextResponse.json(
          { error: sizeValidation.error },
          { status: 400 }
        );
      }
    }

    // 2. Проверка авторизации
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 3. Проверка роли через запрос к БД (безопаснее, чем из сессии)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Forbidden: Only editors and admins can create posts" },
        { status: 403 }
      );
    }

    // 4. Парсинг и валидация тела запроса
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // 5. Валидация через Zod
    console.log("[API] Validating request body...", {
      title: body.title,
      excerpt: body.excerpt?.substring(0, 50),
      coverImage: body.coverImage?.substring(0, 50),
      tagsCount: body.tags?.length,
      sourcesCount: body.sources?.length,
      contentBlocks: body.content?.blocks?.length,
    });
    
    const validationResult = createPostSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("[API] Validation failed:", validationResult.error.errors);
      const formattedError = formatZodError(validationResult.error);
      return NextResponse.json(
        formattedError,
        { status: 400 }
      );
    }

    const { title, excerpt, coverImage, tags, sources, content, slug: providedSlug } = validationResult.data;
    
    console.log("[API] Validation passed. Creating post...", {
      titleLength: title.length,
      excerptLength: excerpt.length,
      providedSlug: providedSlug || 'auto-generate',
      tagsCount: tags?.length || 0,
      sourcesCount: sources?.length || 0,
      contentBlocksCount: content.blocks.length,
    });

    // 6. Проверка реального размера тела запроса
    const bodySize = JSON.stringify(body).length;
    if (bodySize > MAX_JSON_BODY_SIZE) {
      return NextResponse.json(
        { error: `Request body too large. Maximum size is ${MAX_JSON_BODY_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Генерируем slug: используем предоставленный или создаем из title
    let slug: string;
    if (providedSlug && providedSlug.trim().length > 0) {
      // Используем предоставленный slug, но нормализуем его
      slug = generateSlug(providedSlug);
      if (!slug) {
        // Если после нормализации slug пустой, генерируем из title
        slug = generateSlug(title);
      }
    } else {
      // Генерируем slug из title
      slug = generateSlug(title);
    }

    // Проверяем уникальность и добавляем суффикс если нужно
    slug = await generateUniqueSlug(
      slug,
      async (slugToCheck) => {
        const exists = await prisma.post.findUnique({ where: { slug: slugToCheck } });
        return !!exists;
      }
    );

    // Create post in database
    console.log("[API] Saving to database...");
    const newPost = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        coverImage: (coverImage && coverImage.trim().length > 0) ? coverImage : null,
        tags: JSON.stringify(tags || []),
        sources: sources && sources.length > 0 ? JSON.stringify(sources) : null,
        content: JSON.stringify(content),
        readTime: `${Math.ceil(JSON.stringify(content).length / 1000)} мин`,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Parse fields for response with safe error handling
    let tags: string[] = [];
    let content: any = { blocks: [] };
    
    try {
      tags = JSON.parse(newPost.tags) || [];
    } catch (error) {
      console.error('[API POST] Error parsing tags in response:', error);
      tags = [];
    }
    
    try {
      content = JSON.parse(newPost.content) || { blocks: [] };
    } catch (error) {
      console.error('[API POST] Error parsing content in response:', error);
      content = { blocks: [] };
    }
    
    const response = {
      ...newPost,
      tags,
      content,
    };

    console.log("[API] Post created successfully:", newPost.slug);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating post:", error);
    const { message, status } = handleApiError(error, "API POST posts");
    return NextResponse.json(
      { error: message, details: error instanceof Error ? error.message : String(error) },
      { status }
    );
  }
}
