import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import rateLimit from "@/lib/rate-limit";

const reviewSchema = z.object({
  softwareId: z.string(),
  rating: z.number().min(1).max(5),
  content: z.string().max(2000, "Review is too long").optional().nullable(),
});

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 1000,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const softwareId = searchParams.get("softwareId");
    const pageRaw = parseInt(searchParams.get("page") || "1", 10);
    const limitRaw = parseInt(searchParams.get("limit") || "15", 10);
    const page = Number.isNaN(pageRaw) ? 1 : Math.max(pageRaw, 1);
    const limit = Number.isNaN(limitRaw) ? 15 : Math.min(Math.max(limitRaw, 1), 50);

    if (!softwareId) {
      return NextResponse.json({ error: "Software ID is required" }, { status: 400 });
    }

    if (!prisma || !prisma.review) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    const skip = (page - 1) * limit;

    const reviews = await prisma.review.findMany({
      where: { softwareId },
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

    const total = await prisma.review.count({
      where: { softwareId },
    });

    return NextResponse.json({
      reviews,
      hasMore: skip + reviews.length < total,
      total,
    });
  } catch (error: any) {
    console.error("GET /api/reviews: Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await limiter.check(30, `reviews-${session.user.id}`);
    } catch {
      return NextResponse.json(
        { error: "Too many review requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = reviewSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = Array.isArray(result.error.issues) 
        ? result.error.issues[0]?.message 
        : "Validation failed";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { softwareId, rating, content } = result.data;

    // Check if user already reviewed this software
    const existingReview = await prisma.review.findFirst({
      where: {
        softwareId,
        authorId: session.user.id as string,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Вы уже оставляли отзыв к этой программе." },
        { status: 400 }
      );
    }

    // Check if software exists
    const software = await prisma.software.findUnique({
      where: { id: softwareId },
    });

    if (!software) {
      return NextResponse.json({ error: "Software not found" }, { status: 404 });
    }

    const review = await prisma.review.create({
      data: {
        rating,
        content: content || null,
        softwareId,
        authorId: session.user.id as string,
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

    return NextResponse.json(review);
  } catch (error: any) {
    console.error("POST /api/reviews: Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
