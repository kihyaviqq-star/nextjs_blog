import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import rateLimit from "@/lib/rate-limit";
import crypto from "crypto";

const VALID_TYPES = ["FIRE", "IDEA", "ROCKET", "HEART"] as const;
type ReactionType = (typeof VALID_TYPES)[number];

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 1000,
});

function getIpHash(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";
  return crypto.createHash("sha256").update(ip + (process.env.NEXTAUTH_SECRET || "salt")).digest("hex").slice(0, 32);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  try {
    const session = await auth();
    const ipHash = getIpHash(req);
    const userId = session?.user?.id;

    // Fetch all reactions for the post
    const reactions = await prisma.postReaction.findMany({
      where: { postId },
      select: { type: true, ipHash: true, userId: true },
    });

    const counts: Record<ReactionType, number> = {
      FIRE: 0,
      IDEA: 0,
      ROCKET: 0,
      HEART: 0,
    };

    const userReactions: string[] = [];

    reactions.forEach((r) => {
      if (r.type in counts) {
        counts[r.type as ReactionType]++;
      }
      const isUserMatch = (userId && r.userId === userId) || r.ipHash === ipHash;
      if (isUserMatch && !userReactions.includes(r.type)) {
        userReactions.push(r.type);
      }
    });

    return NextResponse.json({ counts, userReactions });
  } catch (error) {
    console.error("GET /api/reactions error:", error);
    return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ipHash = getIpHash(req);
    try {
      await limiter.check(30, `reactions:${ipHash}`);
    } catch {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { postId, type } = body;

    if (!postId || !type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id;

    // Check if reaction already exists
    const existing = await prisma.postReaction.findFirst({
      where: {
        postId,
        type,
        OR: [
          { ipHash },
          ...(userId ? [{ userId }] : []),
        ],
      },
    });

    if (existing) {
      // Toggle off: delete
      await prisma.postReaction.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ toggled: "removed", type });
    } else {
      // Toggle on: create
      await prisma.postReaction.create({
        data: {
          postId,
          type,
          ipHash,
          userId: userId || null,
        },
      });
      return NextResponse.json({ toggled: "added", type });
    }
  } catch (error) {
    console.error("POST /api/reactions error:", error);
    return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 });
  }
}
