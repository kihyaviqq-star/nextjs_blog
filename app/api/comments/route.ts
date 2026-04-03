
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import rateLimit from "@/lib/rate-limit";

const commentSchema = z.object({
  postId: z.string(),
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
  parentId: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
});

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 1000,
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
    const pageRaw = parseInt(searchParams.get("page") || "1", 10);
    const limitRaw = parseInt(searchParams.get("limit") || "15", 10);
    const page = Number.isNaN(pageRaw) ? 1 : Math.max(pageRaw, 1);
    const limit = Number.isNaN(limitRaw) ? 15 : Math.min(Math.max(limitRaw, 1), 50);

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

    // 1) Загружаем только верхнеуровневые комментарии текущей страницы
    const rootComments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
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
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Count total top-level comments for pagination
    const totalTopLevel = await prisma.comment.count({
      where: {
        postId,
        parentId: null,
      },
    });

    // Total count including replies
    const totalAll = await prisma.comment.count({
      where: {
        postId,
      },
    });

    if (rootComments.length === 0) {
      return NextResponse.json({
        comments: [],
        hasMore: false,
        totalTopLevel,
        totalAll,
      });
    }

    // 2) Дозагружаем только потомков для корней текущей страницы (BFS по parentId)
    const descendants: any[] = [];
    let frontier = rootComments.map((comment) => comment.id);

    // Hard cap to avoid accidental unbounded memory growth
    const maxDescendants = 2000;

    while (frontier.length > 0 && descendants.length < maxDescendants) {
      const batch = await prisma.comment.findMany({
        where: {
          postId,
          parentId: {
            in: frontier,
          },
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

      if (batch.length === 0) {
        break;
      }

      descendants.push(...batch);
      frontier = batch.map((comment) => comment.id);
    }

    const commentsForTree = [...rootComments, ...descendants];

    // Строим дерево комментариев
    const commentTree = buildCommentTree(commentsForTree);

    console.log(
      `GET /api/comments: Found ${commentTree.length} root comments, totalTopLevel ${totalTopLevel}, totalAll ${totalAll}`
    );

    return NextResponse.json({
      comments: commentTree,
      hasMore: skip + commentTree.length < totalTopLevel,
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

    try {
      await limiter.check(30, `comments-${session.user.id}`);
    } catch {
      return NextResponse.json(
        { error: "Too many comment requests. Please try again later." },
        { status: 429 }
      );
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
      error: "Failed to create comment",
    }, { status: 500 });
  }
}
