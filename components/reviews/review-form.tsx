"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { StarRating } from "@/components/star-rating";

interface ReviewFormProps {
  softwareId: string;
  onSuccess: (review: any) => void;
}

export function ReviewForm({ softwareId, onSuccess }: ReviewFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (rating === 0) {
      setError("Пожалуйста, поставьте оценку от 1 до 5 звезд.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          softwareId,
          content: content.trim(),
          rating,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Не удалось отправить отзыв");
      }

      setContent("");
      setRating(0);
      onSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="bg-secondary/30 p-6 rounded-2xl border border-border/40 text-center">
        <p className="text-muted-foreground mb-4">Авторизуйтесь, чтобы оставить отзыв и поставить оценку.</p>
        <Button asChild variant="default">
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border/40 shadow-sm space-y-4">
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-foreground">Ваша оценка *</label>
        <StarRating 
          rating={rating} 
          interactive={true} 
          size={28} 
          onRatingChange={setRating} 
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-semibold text-foreground">Отзыв (необязательно)</label>
        <Textarea
          placeholder="Напишите свое мнение о программе..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-y bg-background/50 focus:bg-background transition-colors"
          maxLength={2000}
        />
        <div className="text-xs text-muted-foreground text-right">
          {content.length}/2000
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || rating === 0}
          className="rounded-full px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Отправка...
            </>
          ) : (
            "Оставить отзыв"
          )}
        </Button>
      </div>
    </form>
  );
}
