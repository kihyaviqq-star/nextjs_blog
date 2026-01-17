import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteCommentImage } from "@/lib/file-cleanup";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if comment exists and get imageUrl for cleanup
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        imageUrl: true,
        replies: {
          select: {
            id: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user is the author
    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete image files before deleting comment
    try {
      // Удаляем изображение основного комментария
      if (comment.imageUrl) {
        await deleteCommentImage({ imageUrl: comment.imageUrl });
      }
      
      // Удаляем изображения ответов (replies)
      if (comment.replies && comment.replies.length > 0) {
        for (const reply of comment.replies) {
          if (reply.imageUrl) {
            await deleteCommentImage({ imageUrl: reply.imageUrl });
          }
        }
      }
    } catch (error: any) {
      // Логируем ошибку, но не прерываем удаление комментария
      console.error(`[API DELETE comment] Error deleting images for ${id}:`, error?.message || error);
    }

    // Delete comment (cascade will handle replies if configured)
    // If you want to keep replies, use update with content = "[deleted]"
    // For now, we'll delete the comment and its replies
    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      {
        error: "Failed to delete comment",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
