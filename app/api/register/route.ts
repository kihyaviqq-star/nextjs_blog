import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateUniqueUsername } from "@/lib/username";
import { isUsernameReserved } from "@/lib/constants";

/**
 * POST /api/register
 * Регистрация нового пользователя
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Валидация обязательных полей
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    // Валидация email формата
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Неверный формат email" },
        { status: 400 }
      );
    }

    // Валидация пароля (минимум 6 символов)
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен содержать минимум 6 символов" },
        { status: 400 }
      );
    }

    // Проверка существования пользователя с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже зарегистрирован" },
        { status: 409 }
      );
    }

    // Генерация уникального username
    const username = await generateUniqueUsername(
      email,
      async (username: string) => {
        // Проверка: зарезервирован ли username
        if (isUsernameReserved(username)) {
          return true; // Считаем зарезервированный username занятым
        }

        // Проверка в БД (case-insensitive для SQLite)
        const existingUsername = await prisma.user.findFirst({
          where: { username: username.toLowerCase() },
        });
        return !!existingUsername;
      }
    );

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя в БД
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
        username: username.toLowerCase(), // Lowercase для SQLite
        role: "USER", // По умолчанию обычный пользователь
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    console.log("✅ New user registered:", {
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Регистрация успешна!",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json(
      { error: "Ошибка при регистрации. Попробуйте позже." },
      { status: 500 }
    );
  }
}
