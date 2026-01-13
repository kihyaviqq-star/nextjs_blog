import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUsername, generateUsernameSlug } from "@/lib/constants";

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
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      telegram: user.telegram || "",
      vk: user.vk || "",
      twitter: user.twitter || "",
      github: user.github || "",
      role: user.role,
    });
  } catch (error) {
    console.error("[API] Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
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
    
    const { name, username, bio, email, avatarUrl, telegram, vk, twitter, github } = body;

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

    // Обновляем профиль в базе данных
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        username: username ? username.toLowerCase() : undefined, // Always store lowercase
        bio: bio || undefined,
        // email: email || null, // DISABLED: Email update requires verification
        avatarUrl: avatarUrl || undefined,
        telegram: telegram || null,
        vk: vk || null,
        twitter: twitter || null,
        github: github || null,
      },
    });

    console.log("[API] Profile updated successfully:", updatedUser.name, updatedUser.username);

    // Инвалидируем кеш для обновления данных в UI
    revalidatePath('/');
    revalidatePath('/settings');
    revalidatePath('/admin');
    
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name || "",
      username: updatedUser.username || "",
      email: updatedUser.email,
      bio: updatedUser.bio || "",
      avatarUrl: updatedUser.avatarUrl || "",
      telegram: updatedUser.telegram || "",
      vk: updatedUser.vk || "",
      twitter: updatedUser.twitter || "",
      github: updatedUser.github || "",
      role: updatedUser.role,
    });
  } catch (error) {
    console.error("[API] Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
