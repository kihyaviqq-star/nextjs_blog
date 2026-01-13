import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    console.error("[API GET] Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PUT update post
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "EDITOR") {
      return NextResponse.json(
        { error: "Forbidden: Only editors and admins can update posts" },
        { status: 403 }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const { title, excerpt, coverImage, tags, sources, content } = body;

    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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
    console.error("[API PUT] Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE post
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "EDITOR") {
      return NextResponse.json(
        { error: "Forbidden: Only editors and admins can delete posts" },
        { status: 403 }
      );
    }

    const { slug } = await params;
    
    await prisma.post.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API DELETE] Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
