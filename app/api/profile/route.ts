import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUsername, generateUsernameSlug } from "@/lib/constants";
import { handleApiError } from "@/lib/error-handler";

// GET - получить профиль текущего пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        publicEmail: true,
        showEmail: true,
        bio: true,
        avatarUrl: true,
        telegram: true,
        vk: true,
        twitter: true,
        github: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      name: user.name || "",
      username: user.username || "",
      email: user.email,
      publicEmail: user.publicEmail || "",
      showEmail: user.showEmail || false,
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      telegram: user.telegram || "",
      vk: user.vk || "",
      twitter: user.twitter || "",
      github: user.github || "",
      role: user.role,
    });
  } catch (error) {
    const { message, status } = handleApiError(error, "API GET profile");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// PUT - обновить профиль текущего пользователя
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    
    const { name, username, bio, email, publicEmail, showEmail, avatarUrl, telegram, vk, twitter, github } = body;

    console.log("[API] Updating profile with data:", { name, username, bio, email, avatarUrl, telegram, vk, twitter, github });

    // Validate username if it's being changed
    if (username && username !== (session.user as any).username) {
      const validation = validateUsername(username);
      
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Check if username is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } }, // Exclude current user
            { username: username.toLowerCase() } // SQLite: compare lowercase
          ]
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Это имя пользователя уже занято" },
          { status: 400 }
        );
      }
    }

    // Validate publicEmail if provided
    if (publicEmail !== undefined && publicEmail !== null && publicEmail !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(publicEmail)) {
        return NextResponse.json(
          { error: "Некорректный формат публичного email адреса" },
          { status: 400 }
        );
      }
    }

    // Note: email field is for authentication and should not be changed through profile API
    // To change login email, user should use account recovery or contact admin

    // Обновляем профиль в базе данных
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        username: username ? username.toLowerCase() : undefined, // Always store lowercase
        bio: bio || undefined,
        publicEmail: publicEmail !== undefined ? (publicEmail || null) : undefined,
        showEmail: showEmail !== undefined ? showEmail : undefined,
        avatarUrl: avatarUrl || undefined,
        telegram: telegram || null,
        vk: vk || null,
        twitter: twitter || null,
        github: github || null,
      },
    });

    console.log("[API] Profile updated successfully:", updatedUser.name, updatedUser.username);

    // Инвалидируем кеш для обновления аватара везде
    // Инвалидируем layout для обновления session data в Header (UserMenu, MobileMenu)
    revalidatePath('/', 'layout');
    // Главная страница
    revalidatePath('/');
    // Страница настроек
    revalidatePath('/settings');
    // Страница админки
    revalidatePath('/admin');
    // Все страницы статей (где есть аватар автора и комментарии)
    revalidatePath('/[slug]', 'page');
    // Страница профиля пользователя (динамический путь с username)
    const userSlug = updatedUser.username || updatedUser.id;
    if (userSlug) {
      revalidatePath(`/${userSlug}`, 'page');
    }
    
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name || "",
      username: updatedUser.username || "",
      email: updatedUser.email,
      publicEmail: updatedUser.publicEmail || "",
      showEmail: updatedUser.showEmail || false,
      bio: updatedUser.bio || "",
      avatarUrl: updatedUser.avatarUrl || "",
      telegram: updatedUser.telegram || "",
      vk: updatedUser.vk || "",
      twitter: updatedUser.twitter || "",
      github: updatedUser.github || "",
      role: updatedUser.role,
    });
  } catch (error) {
    const { message, status } = handleApiError(error, "API PUT profile");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
