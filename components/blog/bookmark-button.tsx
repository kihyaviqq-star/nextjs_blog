"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  postId?: string;
  softwareId?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function BookmarkButton({
  postId,
  softwareId,
  variant = "outline",
  size = "sm",
  showLabel = true,
  className,
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    let isMounted = true;

    async function checkBookmark() {
      try {
        const param = postId ? `postId=${postId}` : `softwareId=${softwareId}`;
        const res = await fetch(`/api/bookmarks?${param}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setIsBookmarked(data.bookmarked);
        }
      } catch {
        // silent fail
      }
    }

    checkBookmark();
    return () => {
      isMounted = false;
    };
  }, [session, postId, softwareId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      toast.info("Войдите в аккаунт, чтобы сохранять материалы в закладки");
      return;
    }

    setLoading(true);
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, softwareId }),
      });

      if (res.ok) {
        toast.success(nextState ? "Добавлено в закладки" : "Удалено из закладок");
      } else {
        setIsBookmarked(!nextState);
        toast.error("Не удалось обновить закладку");
      }
    } catch {
      setIsBookmarked(!nextState);
      toast.error("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "gap-2 transition-all duration-200",
        isBookmarked && "text-primary border-primary/40 bg-primary/10",
        className
      )}
      title={isBookmarked ? "Удалить из закладок" : "Сохранить в закладки"}
      aria-label={isBookmarked ? "Удалить из закладок" : "Сохранить в закладки"}
    >
      <Bookmark
        className={cn(
          "w-4 h-4 transition-transform group-hover:scale-110",
          isBookmarked && "fill-primary text-primary"
        )}
      />
      {showLabel && (
        <span className="text-xs sm:text-sm">
          {isBookmarked ? "В закладках" : "Сохранить"}
        </span>
      )}
    </Button>
  );
}
