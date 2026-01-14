import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/error-handler";
import { MAX_JSON_BODY_SIZE } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Проверка роли через запрос к БД (безопаснее, чем из сессии)
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, id: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only ADMINs can change roles
    if (dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "У вас нет прав для изменения ролей пользователей" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Проверка реального размера тела запроса
    const bodySize = JSON.stringify(body).length;
    if (bodySize > MAX_JSON_BODY_SIZE) {
      return NextResponse.json(
        { error: `Request body too large. Maximum size is ${MAX_JSON_BODY_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

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
    if (userId === dbUser.id) {
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
    const { message, status } = handleApiError(error, "API POST update-role");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
