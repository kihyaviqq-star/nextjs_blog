"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PostReactionsProps {
  postId: string;
  className?: string;
}

const REACTION_CONFIG = [
  { type: "FIRE", emoji: "🔥", label: "Огонь" },
  { type: "IDEA", emoji: "💡", label: "Полезно" },
  { type: "ROCKET", emoji: "🚀", label: "Топ" },
  { type: "HEART", emoji: "❤️", label: "Любимое" },
] as const;

export function PostReactions({ postId, className }: PostReactionsProps) {
  const [counts, setCounts] = useState<Record<string, number>>({
    FIRE: 0,
    IDEA: 0,
    ROCKET: 0,
    HEART: 0,
  });
  const [activeReactions, setActiveReactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingType, setAnimatingType] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadReactions() {
      try {
        const res = await fetch(`/api/reactions?postId=${postId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCounts(data.counts || {});
            setActiveReactions(data.userReactions || []);
          }
        }
      } catch (e) {
        // silent fail on fetch
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadReactions();
    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleToggle = async (type: string) => {
    const isCurrentlyActive = activeReactions.includes(type);

    // Trigger micro-animation
    setAnimatingType(type);
    setTimeout(() => setAnimatingType(null), 400);

    // Optimistic update
    setActiveReactions((prev) =>
      isCurrentlyActive ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setCounts((prev) => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + (isCurrentlyActive ? -1 : 1)),
    }));

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type }),
      });

      if (!res.ok) {
        // Revert on error
        toast.error("Не удалось сохранить реакцию");
        setActiveReactions((prev) =>
          isCurrentlyActive ? [...prev, type] : prev.filter((t) => t !== type)
        );
        setCounts((prev) => ({
          ...prev,
          [type]: Math.max(0, (prev[type] || 0) + (isCurrentlyActive ? 1 : -1)),
        }));
      }
    } catch {
      toast.error("Ошибка сети");
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-4 sm:p-5 my-8 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Как вам материал?
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Поставьте реакцию, чтобы поддержать автора
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {REACTION_CONFIG.map(({ type, emoji, label }) => {
            const isActive = activeReactions.includes(type);
            const count = counts[type] || 0;
            const isBouncing = animatingType === type;

            return (
              <button
                key={type}
                onClick={() => handleToggle(type)}
                disabled={loading}
                aria-label={`${label} (${count})`}
                className={cn(
                  "group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none",
                  isActive
                    ? "border-primary/50 bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                    : "border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-border",
                  isBouncing && "scale-125 transition-transform"
                )}
              >
                <span className="text-base group-hover:scale-110 transition-transform">
                  {emoji}
                </span>
                <span className={cn(isActive && "font-semibold")}>
                  {count > 0 ? count : label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
