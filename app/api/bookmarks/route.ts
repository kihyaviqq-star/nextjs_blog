import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ bookmarked: false, bookmarks: [] });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const softwareId = searchParams.get("softwareId");

  try {
    if (postId) {
      const bookmark = await prisma.bookmark.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId,
          },
        },
      });
      return NextResponse.json({ bookmarked: !!bookmark });
    }

    if (softwareId) {
      const bookmark = await prisma.bookmark.findUnique({
        where: {
          userId_softwareId: {
            userId: session.user.id,
            softwareId,
          },
        },
      });
      return NextResponse.json({ bookmarked: !!bookmark });
    }

    // Otherwise return all user bookmarks
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      include: {
        post: {
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            coverImage: true,
            publishedAt: true,
            readTime: true,
          },
        },
        software: {
          select: {
            id: true,
            slug: true,
            name: true,
            shortDesc: true,
            logoUrl: true,
            isAi: true,
            pricing: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("GET /api/bookmarks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { postId, softwareId } = body;

    if (!postId && !softwareId) {
      return NextResponse.json({ error: "postId or softwareId is required" }, { status: 400 });
    }

    if (postId) {
      const existing = await prisma.bookmark.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId,
          },
        },
      });

      if (existing) {
        await prisma.bookmark.delete({
          where: { id: existing.id },
        });
        return NextResponse.json({ bookmarked: false });
      } else {
        await prisma.bookmark.create({
          data: {
            userId: session.user.id,
            postId,
          },
        });
        return NextResponse.json({ bookmarked: true });
      }
    }

    if (softwareId) {
      const existing = await prisma.bookmark.findUnique({
        where: {
          userId_softwareId: {
            userId: session.user.id,
            softwareId,
          },
        },
      });

      if (existing) {
        await prisma.bookmark.delete({
          where: { id: existing.id },
        });
        return NextResponse.json({ bookmarked: false });
      } else {
        await prisma.bookmark.create({
          data: {
            userId: session.user.id,
            softwareId,
          },
        });
        return NextResponse.json({ bookmarked: true });
      }
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/bookmarks error:", error);
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 });
  }
}
