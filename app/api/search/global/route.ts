import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import rateLimit from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 1000,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q || q.length < 2) {
    return NextResponse.json({ posts: [], aiTools: [], software: [], categories: [] });
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  
  try {
    await limiter.check(40, `search:${ip}`);
  } catch {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const qLower = q.toLowerCase();
  const qCapitalized = q.charAt(0).toUpperCase() + q.slice(1).toLowerCase();

  try {
    const [posts, aiTools, software, categories] = await Promise.all([
      // Posts
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { title: { contains: qLower } },
            { title: { contains: qCapitalized } },
            { excerpt: { contains: q } },
            { excerpt: { contains: qLower } },
            { tags: { contains: qLower } },
          ],
        },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          readTime: true,
          publishedAt: true,
        },
        take: 5,
        orderBy: { publishedAt: "desc" },
      }),

      // AI Tools
      prisma.software.findMany({
        where: {
          isAi: true,
          status: "APPROVED",
          OR: [
            { name: { contains: q } },
            { name: { contains: qLower } },
            { name: { contains: qCapitalized } },
            { shortDesc: { contains: q } },
            { shortDesc: { contains: qLower } },
            { tags: { contains: qLower } },
          ],
        },
        select: {
          id: true,
          slug: true,
          name: true,
          shortDesc: true,
          logoUrl: true,
          pricing: true,
          category: { select: { name: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),

      // General Software
      prisma.software.findMany({
        where: {
          isAi: false,
          status: "APPROVED",
          OR: [
            { name: { contains: q } },
            { name: { contains: qLower } },
            { name: { contains: qCapitalized } },
            { shortDesc: { contains: q } },
            { shortDesc: { contains: qLower } },
          ],
        },
        select: {
          id: true,
          slug: true,
          name: true,
          shortDesc: true,
          logoUrl: true,
          pricing: true,
          category: { select: { name: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),

      // Categories
      prisma.softwareCategory.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { name: { contains: qLower } },
            { name: { contains: qCapitalized } },
          ],
        },
        select: {
          id: true,
          slug: true,
          name: true,
          icon: true,
        },
        take: 4,
      }),
    ]);

    return NextResponse.json({
      posts,
      aiTools,
      software,
      categories,
    });
  } catch (error) {
    console.error("GET /api/search/global error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
