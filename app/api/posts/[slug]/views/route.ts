import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import rateLimit from "@/lib/rate-limit";
import { handleApiError } from "@/lib/error-handler";

const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    
    // Rate limit: 1 view per IP per post per hour
    try {
      await limiter.check(1, `${ip}-${slug}`);
    } catch {
      // Возвращаем успех даже при rate limit, чтобы не блокировать UI
      // Просмотр уже был засчитан ранее
      return NextResponse.json(
        { success: true, error: "Rate limit exceeded", views: null },
        { status: 200 }
      );
    }

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
    // Log error but return success to not block UI
    handleApiError(error, "API POST views");
    // Return success even on error to not block the UI
    return NextResponse.json(
      { success: false, error: "Failed to increment views" },
      { status: 200 } // Still 200 to not trigger error handling
    );
  }
}
