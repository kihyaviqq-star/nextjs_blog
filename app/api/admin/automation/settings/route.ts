import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await prisma.automationSettings.findUnique({
    where: { id: "default" }
  });

  if (!settings) {
    settings = await prisma.automationSettings.create({
      data: { id: "default" }
    });
  }

  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
  const settings = await prisma.automationSettings.upsert({
    where: { id: "default" },
    update: {
      softwareAutoEnabled: body.softwareAutoEnabled,
      softwareItemsPerRun: body.softwareItemsPerRun,
      aiAutoEnabled: body.aiAutoEnabled,
      aiItemsPerRun: body.aiItemsPerRun,
      blogAutoEnabled: body.blogAutoEnabled,
      blogPostsPerRun: body.blogPostsPerRun,
      blogTopics: body.blogTopics,
    },
    create: {
      id: "default",
      softwareAutoEnabled: body.softwareAutoEnabled,
      softwareItemsPerRun: body.softwareItemsPerRun,
      aiAutoEnabled: body.aiAutoEnabled,
      aiItemsPerRun: body.aiItemsPerRun,
      blogAutoEnabled: body.blogAutoEnabled,
      blogPostsPerRun: body.blogPostsPerRun,
      blogTopics: body.blogTopics,
    }
  });

  return NextResponse.json(settings);
}
