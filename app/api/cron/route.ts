import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runSoftwareScraper } from "@/lib/services/scraper";
import { runBlogGenerator } from "@/lib/services/blog-generator";

// To securely call this endpoint from a cron job (like Vercel Cron), 
// you should use an Authorization header. For local Windows use, we'll allow it or use a secret key.
export const maxDuration = 300; 

export async function GET(request: NextRequest) {
  // Check auth header if CRON_SECRET is set
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const settings = await prisma.automationSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      return NextResponse.json({ message: "No settings configured" });
    }

    const now = new Date();
    const results = [];

    // Check Software Scraper
    if (settings.softwareAutoEnabled) {
      const lastRun = settings.softwareLastRun;
      // If never run, or last run was > 24 hours ago
      if (!lastRun || (now.getTime() - lastRun.getTime()) > 24 * 60 * 60 * 1000) {
        try {
          const res = await runSoftwareScraper(settings.softwareItemsPerRun);
          await prisma.automationLog.create({
            data: {
              type: "SOFTWARE_CRON",
              status: "SUCCESS",
              itemsAdded: res.added,
              message: `Auto-run: Добавлено ${res.added} программ.`
            }
          });
          
          await prisma.automationSettings.update({
            where: { id: "default" },
            data: { softwareLastRun: now }
          });
          results.push(`Software: added ${res.added}`);
        } catch (error: any) {
          console.error("Cron Software Error:", error);
          await prisma.automationLog.create({
            data: { type: "SOFTWARE_CRON", status: "ERROR", message: error.message || "Unknown error" }
          });
        }
      }
    }

    // Check Blog Generator
    if (settings.blogAutoEnabled) {
      const lastRun = settings.blogLastRun;
      // If never run, or last run was > 24 hours ago
      if (!lastRun || (now.getTime() - lastRun.getTime()) > 24 * 60 * 60 * 1000) {
        try {
          const res = await runBlogGenerator(settings.blogPostsPerRun, settings.blogTopics);
          await prisma.automationLog.create({
            data: {
              type: "BLOG_CRON",
              status: "SUCCESS",
              itemsAdded: res.added,
              message: `Auto-run: Добавлено ${res.added} статей.`
            }
          });
          
          await prisma.automationSettings.update({
            where: { id: "default" },
            data: { blogLastRun: now }
          });
          results.push(`Blog: added ${res.added}`);
        } catch (error: any) {
          console.error("Cron Blog Error:", error);
          await prisma.automationLog.create({
            data: { type: "BLOG_CRON", status: "ERROR", message: error.message || "Unknown error" }
          });
        }
      }
    }

    return NextResponse.json({ success: true, results, message: "Cron jobs executed if needed." });
  } catch (error: any) {
    console.error("Cron Master Error:", error);
    return NextResponse.json({ error: "Internal Cron Error" }, { status: 500 });
  }
}
