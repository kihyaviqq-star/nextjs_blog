
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess: (comment: any) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({ postId, parentId, onSuccess, onCancel, autoFocus }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 5МБ");
        return;
      }
      setImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    if (!session) {
        toast.error("Необходимо авторизоваться для отправки комментария");
        return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image if exists
      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("type", "comment-image");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Ошибка загрузки изображения");
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      // Create comment
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content,
          parentId,
          imageUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Не удалось отправить комментарий");
      }

      const newComment = await res.json();
      
      setContent("");
      removeImage();
      toast.success("Комментарий опубликован");
      onSuccess(newComment);
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
      return (
          <div className="p-4 rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">Войдите</Link>, чтобы оставить комментарий.
          </div>
      );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={parentId ? "Напишите ответ..." : "Напишите комментарий..."}
          className="min-h-[100px] resize-none pr-12"
          autoFocus={autoFocus}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
           <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            title="Прикрепить изображение"
          >
            <ImagePlus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {imagePreview && (
        <div className="relative inline-block mt-2">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="h-24 w-auto rounded-md object-cover border border-border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeImage}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Отмена
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Отправить
        </Button>
      </div>
    </form>
  );
}
