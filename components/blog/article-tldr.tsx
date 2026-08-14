"use client";

import { Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleTldrProps {
  excerpt?: string;
  points?: string[];
  className?: string;
}

export function ArticleTldr({ excerpt, points, className }: ArticleTldrProps) {
  // If points not explicitly provided, split excerpt by sentences or format cleanly
  const items: string[] = points && points.length > 0
    ? points
    : (excerpt
        ? excerpt
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 10)
        : []);

  if (items.length === 0 && !excerpt) return null;

  return (
    <div
      className={cn(
        "my-8 relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent p-5 sm:p-6 shadow-sm",
        className
      )}
    >
      {/* Decorative gradient corner */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground m-0">
          Кратко о главном (TL;DR)
        </h3>
      </div>

      {items.length > 1 ? (
        <ul className="space-y-2.5 my-0 pl-0 list-none text-sm sm:text-base text-foreground/85">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 my-0">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-1" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm sm:text-base leading-relaxed text-foreground/85 my-0">
          {excerpt || items[0]}
        </p>
      )}
    </div>
  );
}
