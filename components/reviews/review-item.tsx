"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { UserCircle } from "lucide-react";
import { StarRating } from "@/components/star-rating";

interface ReviewItemProps {
  review: any;
}

export function ReviewItem({ review }: ReviewItemProps) {
  const author = review.author;

  return (
    <div className="flex gap-4 p-4 md:p-6 bg-card rounded-2xl border border-border/40 shadow-sm">
      <div className="shrink-0 mt-1">
        {author?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={author.avatarUrl} 
            alt={author.name || "Пользователь"} 
            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-border"
          />
        ) : (
          <UserCircle className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/50" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <span className="font-semibold text-foreground text-base">
              {author?.name || "Анонимный пользователь"}
            </span>
            {author?.username && (
              <span className="text-muted-foreground text-sm ml-2 hidden sm:inline">
                @{author.username}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <StarRating rating={review.rating} size={16} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: ru })}
            </span>
          </div>
        </div>

        {review.content && (
          <div className="text-foreground/90 leading-relaxed text-sm md:text-base break-words mt-3">
            {review.content.split("\\n").map((paragraph: string, i: number) => (
              <p key={i} className="mb-2 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
