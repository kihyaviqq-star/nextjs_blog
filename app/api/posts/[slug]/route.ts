import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePostSchema, validateBodySize, formatZodError, MAX_JSON_BODY_SIZE } from "@/lib/validations";
import { handleApiError } from "@/lib/error-handler";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET single post
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            // email: true, // Removed for privacy
            avatarUrl: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const postWithParsedFields = {
      ...post,
      tags: JSON.parse(post.tags),
      sources: post.sources ? JSON.parse(post.sources) : [],
      content: JSON.parse(post.content),
    };

    return NextResponse.json(postWithParsedFields);
  } catch (error) {
    const { message, status } = handleApiError(error, "API GET post");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// PUT update post
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 1. Проверка сессии
    const session = await auth();
    
    if (!session?.user || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Проверка роли через запрос к БД (безопаснее, чем из сессии)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 3. Доступ имеют только ADMIN и EDITOR
    if (user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Forbidden: Only editors and admins can update posts" },
        { status: 403 }
      );
    }

    const { slug } = await params;
    
    // 4. Проверяем существование поста в БД
    const existingPost = await prisma.post.findUnique({
      where: { slug },
      select: { authorId: true }
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // 5. IDOR защита: EDITOR может редактировать только свои посты, ADMIN - любые
    if (user.role !== "ADMIN" && existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own posts" },
        { status: 403 }
      );
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
    const validationResult = updatePostSchema.safeParse(body);
    if (!validationResult.success) {
      const formattedError = formatZodError(validationResult.error);
      return NextResponse.json(
        formattedError,
        { status: 400 }
      );
    }

    const { title, excerpt, coverImage, tags, sources, content } = validationResult.data;

    // Update post in database (keep original slug)
    const updatedPost = await prisma.post.update({
      where: { slug },
      data: {
        title,
        excerpt,
        coverImage: coverImage || null,
        tags: JSON.stringify(tags || []),
        sources: sources && sources.length > 0 ? JSON.stringify(sources) : null,
        content: JSON.stringify(content),
        readTime: `${Math.ceil(JSON.stringify(content).length / 1000)} мин`,
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
      ...updatedPost,
      tags: JSON.parse(updatedPost.tags),
      sources: updatedPost.sources ? JSON.parse(updatedPost.sources) : [],
      content: JSON.parse(updatedPost.content),
    };

    return NextResponse.json(response);
  } catch (error) {
    const { message, status } = handleApiError(error, "API PUT post");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// DELETE post
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 1. Проверка сессии
    const session = await auth();
    
    if (!session?.user || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Проверка роли через запрос к БД (безопаснее, чем из сессии)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 3. Доступ имеют только ADMIN и EDITOR
    if (user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Forbidden: Only editors and admins can delete posts" },
        { status: 403 }
      );
    }

    const { slug } = await params;
    
    // 4. Проверяем существование поста в БД
    const existingPost = await prisma.post.findUnique({
      where: { slug },
      select: { authorId: true }
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // 5. IDOR защита: EDITOR может удалять только свои посты, ADMIN - любые
    if (user.role !== "ADMIN" && existingPost.authorId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own posts" },
        { status: 403 }
      );
    }
    
    await prisma.post.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = handleApiError(error, "API DELETE post");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
