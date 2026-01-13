import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    // Only ADMINs can change roles
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "У вас нет прав для изменения ролей пользователей" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId и role обязательны" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["USER", "EDITOR", "ADMIN"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Недопустимая роль. Допустимые роли: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Prevent changing own role (optional safety check)
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Нельзя изменить собственную роль" },
        { status: 400 }
      );
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    console.log(
      `[Admin] Role changed: ${user.email} (${user.role} → ${updatedUser.role}) by ${session.user.email}`
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("[API] Error updating user role:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
