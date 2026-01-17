
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const commentSchema = z.object({
  postId: z.string(),
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
  parentId: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
});

// Функция для построения дерева комментариев из плоского списка (неограниченная вложенность)
function buildCommentTree(comments: any[]): any[] {
  // Создаем мапу для быстрого доступа к комментариям по ID
  const commentMap = new Map<string, any>();
  const rootComments: any[] = [];

  // Инициализируем все комментарии
  comments.forEach((comment) => {
    commentMap.set(comment.id, {
      ...comment,
      replies: [],
    });
  });

  // Строим дерево
  comments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment.id);
    
    if (comment.parentId) {
      // Это ответ - добавляем к родительскому комментарию
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
    } else {
      // Это верхнеуровневый комментарий
      rootComments.push(commentWithReplies);
    }
  });

  // Сортируем ответы по дате создания
  const sortReplies = (comment: any) => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      comment.replies.forEach(sortReplies);
    }
  };

  rootComments.forEach(sortReplies);

  return rootComments;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Check if prisma is properly initialized
    if (!prisma || !prisma.comment) {
      console.error("GET /api/comments: Prisma client is not properly initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    const skip = (page - 1) * limit;

    console.log(`GET /api/comments: Fetching comments for post ${postId}, page ${page}, limit ${limit}`);

    // Загружаем все комментарии поста одним запросом (эффективнее чем рекурсивные запросы)
    const allComments = await prisma.comment.findMany({
      where: {
        postId,
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
      orderBy: {
        createdAt: "asc",
      },
    });

    // Строим дерево комментариев
    const commentTree = buildCommentTree(allComments);

    // Применяем пагинацию только к верхнеуровневым комментариям
    const sortedRootComments = commentTree.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const comments = sortedRootComments.slice(skip, skip + limit);

    // Count total top-level comments for pagination
    const totalTopLevel = await prisma.comment.count({
      where: {
        postId,
        parentId: null,
      },
    });

    // Total including replies (we already fetched all comments above)
    const totalAll = allComments.length;

    console.log(
      `GET /api/comments: Found ${comments.length} root comments, totalTopLevel ${totalTopLevel}, totalAll ${totalAll}`
    );

    return NextResponse.json({
      comments,
      hasMore: skip + comments.length < totalTopLevel,
      totalTopLevel,
      totalAll,
    });
  } catch (error: any) {
    console.error("GET /api/comments: Error fetching comments:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json({ 
      error: "Failed to fetch comments",
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      console.error("POST /api/comments: No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("POST /api/comments: Body received", { postId: body.postId, hasContent: !!body.content, hasParentId: !!body.parentId });

    const result = commentSchema.safeParse(body);

    if (!result.success) {
      console.error("POST /api/comments: Validation error:", result.error);
      const errorMessage = Array.isArray(result.error.issues) 
        ? result.error.issues[0]?.message 
        : "Validation failed";
        
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { postId, content, parentId, imageUrl } = result.data;

    // Rate limiting: Check last comment by this user (max 1 per 5 seconds)
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const lastComment = await prisma.comment.findFirst({
      where: {
        authorId: session.user.id as string,
        createdAt: {
          gte: fiveSecondsAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (lastComment) {
      const timeSinceLastComment = Date.now() - lastComment.createdAt.getTime();
      const remainingSeconds = Math.ceil((5000 - timeSinceLastComment) / 1000);
      return NextResponse.json(
        { 
          error: "Слишком много комментариев. Попробуйте снова через несколько секунд.",
          retryAfter: remainingSeconds
        },
        { status: 429 }
      );
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      console.error(`POST /api/comments: Post not found: ${postId}`);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if parent comment exists (if parentId provided)
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        console.error(`POST /api/comments: Parent comment not found: ${parentId}`);
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    console.log(`POST /api/comments: Creating comment for post ${postId} by user ${session.user.id}`);
    
    // Check if prisma is properly initialized
    if (!prisma || !prisma.comment) {
      console.error("POST /api/comments: Prisma client is not properly initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }
    
    const comment = await prisma.comment.create({
      data: {
        content,
        imageUrl: imageUrl || null,
        postId,
        authorId: session.user.id as string,
        parentId: parentId || null,
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

    console.log(`POST /api/comments: Comment created successfully: ${comment.id}`);
    return NextResponse.json(comment);
  } catch (error: any) {
    console.error("POST /api/comments: Error creating comment:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json({ 
      error: error?.message || "Failed to create comment",
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
