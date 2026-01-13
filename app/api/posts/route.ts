import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
            email: true,
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
    console.error("[API] Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST create new post
export async function POST(request: NextRequest) {
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
        { error: "Forbidden: Only editors and admins can create posts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, excerpt, coverImage, tags, sources, content } = body;

    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-zа-я0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

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
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
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
    console.error("[API] Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
