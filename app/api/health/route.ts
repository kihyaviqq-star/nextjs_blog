import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unknown";
  let dbLatencyMs = 0;

  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStartTime;
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "disconnected";
    console.error("Health check DB query failed:", error);
  }

  const isHealthy = dbStatus === "connected";
  const memoryUsage = process.memoryUsage();

  const healthData = {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    memory: {
      rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
    },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development",
    totalResponseTimeMs: Date.now() - startTime,
  };

  return NextResponse.json(healthData, {
    status: isHealthy ? 200 : 503,
  });
}
