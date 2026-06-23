"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { StarRating } from "@/components/star-rating";
import { Loader2 } from "lucide-react";

interface RatingWidgetProps {
  softwareId: string;
  initialRating?: number; // User's existing rating, if any
  totalRatings?: number; // Total count of ratings to display
}

export function RatingWidget({ softwareId, initialRating = 0, totalRatings = 0 }: RatingWidgetProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(initialRating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRate = async (newRating: number) => {
    if (!session) {
      setError("Войдите, чтобы оценить");
      return;
    }
    
    // Optimistic UI update
    setRating(newRating);
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          softwareId,
          rating: newRating,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка сохранения");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
      setRating(initialRating); // Revert optimistic update
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <StarRating 
          rating={rating} 
          interactive={!!session} 
          onRatingChange={handleRate} 
          size={24} 
        />
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      
      <div className="text-xs text-muted-foreground h-4">
        {error ? (
          <span className="text-red-500">{error}</span>
        ) : success ? (
          <span className="text-green-500 font-medium">Оценка сохранена!</span>
        ) : !session ? (
          <span>Авторизуйтесь для оценки</span>
        ) : rating > 0 && initialRating === 0 ? (
          <span>Оцените программу</span>
        ) : (
          <span>Ваша оценка</span>
        )}
      </div>
    </div>
  );
}
