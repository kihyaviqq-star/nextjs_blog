import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { runSoftwareScraper } from "@/lib/services/scraper";
import { runBlogGenerator } from "@/lib/services/blog-generator";
import { runAiStatScraper } from "@/lib/services/ai-stat-scraper";

export const maxDuration = 300; // 5 minutes max duration for serverless functions
export const dynamic = 'force-dynamic'; // Prevent Next.js from caching the streaming response

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, limit } = body;
  
  if (!type || !limit) {
    return NextResponse.json({ error: "Missing type or limit" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        let result: any = { added: 0, names: [] };
        
        const onProgress = (message: string, current: number, total: number) => {
          sendEvent({ status: 'progress', message, current, total });
        };

        sendEvent({ status: 'progress', message: 'Запуск процесса...', current: 0, total: limit });

        if (type === "SOFTWARE") {
          result = await runSoftwareScraper(limit, onProgress);
        } else if (type === "BLOG") {
          const settings = await prisma.automationSettings.findUnique({ where: { id: "default" } });
          const topics = settings?.blogTopics || "Искусственный интеллект, Нейросети";
          result = await runBlogGenerator(limit, topics, onProgress);
        } else if (type === "AI_SERVICE") {
          result = await runAiStatScraper(limit, onProgress);
        } else {
          throw new Error("Invalid type");
        }

        const message = `Добавлено ${result.added} записей: ${result.names?.join(', ') || result.titles?.join(', ') || ''}`;
        
        // Log the run
        await prisma.automationLog.create({
          data: {
            type,
            status: "SUCCESS",
            itemsAdded: result.added || 0,
            message: message.substring(0, 500)
          }
        });

        sendEvent({ status: 'done', message, added: result.added });
      } catch (error: any) {
        console.error("Automation error:", error);
        
        await prisma.automationLog.create({
          data: {
            type,
            status: "ERROR",
            itemsAdded: 0,
            message: (error.message || "Unknown error").substring(0, 500)
          }
        });

        sendEvent({ status: 'error', message: error.message || "Unknown error" });
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
