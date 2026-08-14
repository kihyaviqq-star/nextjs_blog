import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check role in DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden: Admin or Editor role required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { toolId, action } = body;

    if (!toolId || !action) {
      return NextResponse.json({ error: "toolId and action are required" }, { status: 400 });
    }

    let updatedTool = null;

    if (action === "APPROVE") {
      updatedTool = await prisma.software.update({
        where: { id: toolId },
        data: { status: "APPROVED" },
      });
    } else if (action === "REJECT") {
      updatedTool = await prisma.software.update({
        where: { id: toolId },
        data: { status: "REJECTED" },
      });
    } else if (action === "DELETE") {
      await prisma.software.delete({
        where: { id: toolId },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    try {
      revalidateTag("tools");
      revalidateTag("software");
      revalidatePath("/tools");
      revalidatePath("/software");
      revalidatePath("/dashboard/tools-moderation");
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, tool: updatedTool });
  } catch (error) {
    console.error("POST /api/admin/tools/moderate error:", error);
    return NextResponse.json({ error: "Failed to moderate tool" }, { status: 500 });
  }
}
