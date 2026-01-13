import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch site settings
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create default settings
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.siteSettings.create({
        data: {
          id: "default",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[Settings GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT - Update site settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    // Only ADMIN can update settings
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { siteName, logoUrl, faviconUrl, metaDescription, footerText } = body;

    // Update or create settings
    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {
        siteName,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        metaDescription: metaDescription || null,
        footerText: footerText || null,
      },
      create: {
        id: "default",
        siteName,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        metaDescription: metaDescription || null,
        footerText: footerText || null,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[Settings PUT] Error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
