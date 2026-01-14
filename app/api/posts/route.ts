import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPostSchema, validateBodySize, formatZodError, MAX_JSON_BODY_SIZE } from "@/lib/validations";
import { handleApiError } from "@/lib/error-handler";

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

    // Parse JSON fields for client
    const postsWithParsedFields = posts.map((post) => ({
      ...post,
      tags: JSON.parse(post.tags),
      content: JSON.parse(post.content),
    }));

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
    const contentLength = request.headers.get('content-length');
    const sizeValidation = validateBodySize(contentLength);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 400 }
      );
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
    const validationResult = createPostSchema.safeParse(body);
    if (!validationResult.success) {
      const formattedError = formatZodError(validationResult.error);
      return NextResponse.json(
        formattedError,
        { status: 400 }
      );
    }

    const { title, excerpt, coverImage, tags, sources, content } = validationResult.data;

    // 6. Проверка реального размера тела запроса
    const bodySize = JSON.stringify(body).length;
    if (bodySize > MAX_JSON_BODY_SIZE) {
      return NextResponse.json(
        { error: `Request body too large. Maximum size is ${MAX_JSON_BODY_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Generate unique slug from title
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-zа-я0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    // Ensure slug is unique by checking database and adding suffix if needed
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create post in database
    const newPost = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        coverImage: coverImage || null,
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

    // Parse fields for response
    const response = {
      ...newPost,
      tags: JSON.parse(newPost.tags),
      content: JSON.parse(newPost.content),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const { message, status } = handleApiError(error, "API POST posts");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
