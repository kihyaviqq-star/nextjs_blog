
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Fetch top-level comments (parentId is null)
    const comments = await prisma.comment.findMany({
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
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
            replies: { // Fetch 2nd level replies too (optional, but good for UX)
               include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
               }
            }
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip,
    });

    // Count total top-level comments for pagination
    const total = await prisma.comment.count({
      where: {
        postId,
        parentId: null,
      },
    });

    return NextResponse.json({
      comments,
      hasMore: skip + comments.length < total,
      total,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = commentSchema.safeParse(body);

    if (!result.success) {
      console.error("Validation error:", result.error);
      const errorMessage = Array.isArray(result.error.issues) 
        ? result.error.issues[0]?.message 
        : "Validation failed";
        
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { postId, content, parentId, imageUrl } = result.data;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if parent comment exists (if parentId provided)
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    // Create user in DB if not exists (using email from session)
    // Actually auth() ensures we have a session, but we need the DB user ID.
    // The session.user.id *should* be the DB id if using PrismaAdapter, but let's be safe.
    // With Auth.js + Prisma, session.user.id IS the DB ID.
    
    const comment = await prisma.comment.create({
      data: {
        content,
        imageUrl,
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

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
