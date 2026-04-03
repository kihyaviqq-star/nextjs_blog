import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/error-handler";
import { MAX_JSON_BODY_SIZE } from "@/lib/validations";
import rateLimit from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await limiter.check(20, `update-role-${session.user.email}`);
    } catch {
      return NextResponse.json(
        { error: "Too many role update attempts. Please wait." },
        { status: 429 }
      );
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

    console.log(`[Admin] Role changed for userId=${user.id} (${user.role} -> ${updatedUser.role})`);

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
