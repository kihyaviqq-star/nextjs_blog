
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/emoji-picker";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess: (comment: any) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

const MAX_COMMENT_LENGTH = 1000;

export function CommentForm({ postId, parentId, onSuccess, onCancel, autoFocus }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content - no scroll until 1000 characters
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 100;
      
      // Always expand without scroll, only limit to content length (1000 chars max)
      const newHeight = Math.max(scrollHeight, minHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = "hidden";
    }
  }, [content]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Разрешены только изображения форматов: JPG, PNG, WebP, GIF");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 5МБ");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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

    // Rate limiting check (client-side - UX only, server enforces it)
    const lastCommentTime = sessionStorage.getItem(`lastCommentTime_${session.user.id}`);
    if (lastCommentTime) {
      const timeSinceLastComment = Date.now() - parseInt(lastCommentTime);
      if (timeSinceLastComment < 5000) {
        const remainingSeconds = Math.ceil((5000 - timeSinceLastComment) / 1000);
        toast.error(`Подождите ${remainingSeconds} секунд перед отправкой следующего комментария`);
        return;
      }
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
        let errorMessage = "Не удалось отправить комментарий";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          errorMessage = `Ошибка ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const newComment = await res.json();
      
      // Save last comment time for rate limiting
      if (session?.user?.id) {
        sessionStorage.setItem(`lastCommentTime_${session.user.id}`, Date.now().toString());
      }
      
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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_COMMENT_LENGTH) {
      setContent(newContent);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newContent = content.substring(0, start) + emoji + content.substring(end);
      // Check if adding emoji would exceed limit
      if (newContent.length <= MAX_COMMENT_LENGTH) {
        setContent(newContent);
        // Set cursor position after emoji
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 0);
      } else {
        toast.error(`Превышен лимит символов (${MAX_COMMENT_LENGTH})`);
      }
    } else {
      if (content.length + emoji.length <= MAX_COMMENT_LENGTH) {
        setContent(content + emoji);
      } else {
        toast.error(`Превышен лимит символов (${MAX_COMMENT_LENGTH})`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder={parentId ? "Напишите ответ..." : "Напишите комментарий..."}
          className="min-h-[100px] resize-none pr-3 pb-16"
          maxLength={MAX_COMMENT_LENGTH}
          autoFocus={autoFocus}
        />
        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
          />
          <div className="pointer-events-auto">
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
          <div className="pointer-events-auto">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>
      </div>

      {imagePreview && (
        <div className="relative inline-block mt-2">
          <Image 
            src={imagePreview} 
            alt="Preview" 
            width={96}
            height={96}
            className="h-24 w-auto rounded-md object-cover border border-border"
            unoptimized={imagePreview.startsWith('blob:') || imagePreview.startsWith('data:')}
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

      <div className="flex items-center justify-between gap-2">
        <span className={cn(
          "text-sm",
          content.length > MAX_COMMENT_LENGTH * 0.9 && content.length < MAX_COMMENT_LENGTH && "text-yellow-500",
          content.length === MAX_COMMENT_LENGTH && "text-destructive",
          content.length <= MAX_COMMENT_LENGTH * 0.9 && "text-muted-foreground"
        )}>
          {content.length}/{MAX_COMMENT_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Отмена
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || !content.trim() || content.length > MAX_COMMENT_LENGTH}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Отправить
          </Button>
        </div>
      </div>
    </form>
  );
}
