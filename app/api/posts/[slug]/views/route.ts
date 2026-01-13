import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Increment view count
    const updatedPost = await prisma.post.update({
      where: { slug },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        id: true,
        slug: true,
        views: true,
      },
    });

    return NextResponse.json({
      success: true,
      views: updatedPost.views,
    });
  } catch (error) {
    console.error("[API] Error incrementing views:", error);
    // Return success even on error to not block the UI
    return NextResponse.json(
      { success: false, error: "Failed to increment views" },
      { status: 200 } // Still 200 to not trigger error handling
    );
  }
}
