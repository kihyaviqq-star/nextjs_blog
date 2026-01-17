
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, User, Reply, Trash2 } from "lucide-react";
import { CommentForm } from "./comment-form";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentAuthor {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: CommentAuthor;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onReplyAdded: (newComment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  level?: number;
}

export function CommentItem({ comment, postId, onReplyAdded, onCommentDeleted, level = 0 }: CommentItemProps) {
  const { data: session } = useSession();
  const [isReplying, setIsReplying] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isOwner = session?.user?.id === comment.author.id;
  
  // Логика для скрытия/показа ответов
  const MAX_VISIBLE_REPLIES = 2;
  const hasMoreThanTwoReplies = replies.length > MAX_VISIBLE_REPLIES;
  const visibleReplies = showAllReplies ? replies : replies.slice(0, MAX_VISIBLE_REPLIES);
  const hiddenRepliesCount = replies.length - MAX_VISIBLE_REPLIES;

  // Update replies when comment prop changes (e.g., after page reload)
  // Но синхронизируем только если в prop есть новые комментарии
  useEffect(() => {
    if (comment.replies) {
      const propReplyIds = new Set(comment.replies.map((r: Comment) => r.id));
      const localReplyIds = new Set(replies.map((r: Comment) => r.id));
      
      // Проверяем, есть ли в prop комментарии, которых нет локально
      const hasNewReplies = comment.replies.some((r: Comment) => !localReplyIds.has(r.id));
      
      // Также проверяем, есть ли удаленные комментарии в prop
      const hasRemovedReplies = replies.some((r: Comment) => !propReplyIds.has(r.id));
      
      // Обновляем только если есть изменения
      if (hasNewReplies || hasRemovedReplies) {
        setReplies(comment.replies);
      }
    } else if (!comment.replies && replies.length > 0) {
      // Если prop говорит что нет ответов, но локально есть - сбрасываем
      setReplies([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment.replies]);

  const handleReplySuccess = (newReply: Comment) => {
    console.log("handleReplySuccess called with:", newReply);
    // Обновляем локальное состояние сразу для мгновенного отображения
    setReplies((prev) => {
      console.log("Updating replies from", prev, "to", [...prev, newReply]);
      const updated = [...prev, { ...newReply, replies: [] }];
      // Если комментарий был скрыт, показываем все ответы чтобы новый комментарий был виден
      if (!showAllReplies && updated.length > MAX_VISIBLE_REPLIES) {
        // Используем setTimeout чтобы setShowAllReplies вызывался после обновления состояния
        setTimeout(() => setShowAllReplies(true), 0);
      }
      return updated;
    });
    setIsReplying(false);
    // Notify parent component to update state at all levels
    onReplyAdded(newReply);
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Не удалось удалить комментарий");
      }

      toast.success("Комментарий удален");
      
      // Notify parent component
      if (onCommentDeleted) {
        onCommentDeleted(comment.id);
      }
    } catch (error: any) {
      toast.error(error.message || "Ошибка при удалении комментария");
    } finally {
      setIsDeleting(false);
    }
  };

  const hasReplies = replies && replies.length > 0;
  
  // Limit nesting visual indentation to avoid squeezing content too much
  const indentClass = level > 0 ? "ml-4 md:ml-12" : "";

  const profileUrl = comment.author.username 
    ? `/${comment.author.username}` 
    : `/${comment.author.id}`;

  if (isCollapsed) {
    return (
      <div className={cn("group animate-in fade-in slide-in-from-top-2", level > 0 && "mt-4")}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1.5"
            onClick={() => setIsCollapsed(false)}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {comment.author.name || "Пользователь"}
            {hasReplies && ` (${replies.length} ${replies.length === 1 ? 'ответ' : replies.length < 5 ? 'ответа' : 'ответов'})`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group animate-in fade-in slide-in-from-top-2", level > 0 && "mt-4")}>
      <div className="flex gap-4">
        <Link href={profileUrl} className="flex-shrink-0">
          <Avatar className="w-10 h-10 border border-border hover:ring-2 ring-primary/50 transition-all cursor-pointer">
            <AvatarImage src={comment.author.avatarUrl || ""} alt={comment.author.name || "User"} />
            <AvatarFallback className="bg-muted">
              <User className="w-5 h-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link 
                href={profileUrl}
                className="font-semibold text-sm hover:text-primary transition-colors"
              >
                {comment.author.name || "Пользователь"}
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ru })}
              </span>
            </div>
          </div>

          <div className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
            {comment.content}
          </div>

          {comment.imageUrl && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="mt-2 rounded-lg overflow-hidden border border-border w-fit max-w-[80px] cursor-zoom-in hover:opacity-90 transition-opacity">
                  <Image 
                    src={comment.imageUrl} 
                    alt="Comment attachment" 
                    width={80}
                    height={80}
                    className="w-full h-auto object-cover max-h-[80px]"
                    unoptimized={comment.imageUrl.startsWith('http') || comment.imageUrl.startsWith('/')}
                  />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-screen-lg w-auto p-0 bg-background border border-border">
                <DialogTitle className="sr-only">Просмотр изображения</DialogTitle>
                <div className="relative w-full min-w-[400px] min-h-[400px] max-w-[90vw] max-h-[90vh] flex items-center justify-center p-4">
                  <Image 
                    src={comment.imageUrl} 
                    alt="Comment attachment full" 
                    width={1200}
                    height={800}
                    className="max-w-full max-h-[85vh] object-contain rounded-md"
                    unoptimized={comment.imageUrl.startsWith('http') || comment.imageUrl.startsWith('/')}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="flex items-center gap-2 pt-1">
            {hasReplies && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-muted-foreground hover:text-foreground -ml-2 gap-1.5"
                onClick={() => setIsCollapsed(true)}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Свернуть
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-muted-foreground hover:text-primary -ml-2 gap-1.5"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="w-3.5 h-3.5" />
              Ответить
            </Button>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 transition-colors"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Удалить
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить комментарий?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Комментарий и все ответы на него будут удалены.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {isReplying && (
            <div className="mt-4 pl-4 border-l-2 border-border/50">
               <CommentForm 
                 postId={postId} 
                 parentId={comment.id} 
                 onSuccess={handleReplySuccess}
                 onCancel={() => setIsReplying(false)}
                 autoFocus
               />
            </div>
          )}
        </div>
      </div>

      {hasReplies && (
        <div className="mt-4 ml-4 md:ml-12 space-y-4 border-l-2 border-border/30 pl-4">
          {visibleReplies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              postId={postId}
              onReplyAdded={(newReply) => {
                // Update the specific reply's replies in the parent state immediately
                // newReply.parentId должен быть равен reply.id, если это ответ на reply
                setReplies((prev) => {
                  const updateReplies = (repliesList: Comment[]): Comment[] => {
                    return repliesList.map((r) => {
                      // Проверяем, является ли этот комментарий родителем нового ответа
                      if (r.id === newReply.parentId) {
                        return {
                          ...r,
                          replies: [...(r.replies || []), { ...newReply, replies: [] }]
                        };
                      }
                      // Рекурсивно обновляем ответы на этом комментарии
                      if (r.replies && r.replies.length > 0) {
                        return {
                          ...r,
                          replies: updateReplies(r.replies)
                        };
                      }
                      return r;
                    });
                  };
                  return updateReplies(prev);
                });
                // Also notify parent component to update main state
                onReplyAdded(newReply);
              }}
              onCommentDeleted={(deletedId) => {
                // Remove deleted comment from replies
                setReplies((prev) => prev.filter((r) => r.id !== deletedId));
                // Also notify parent
                if (onCommentDeleted) {
                  onCommentDeleted(deletedId);
                }
              }}
              level={level + 1}
            />
          ))}
          
          {/* Кнопка "N Ответов" для показа скрытых комментариев */}
          {hasMoreThanTwoReplies && !showAllReplies && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-primary gap-1.5 -ml-2"
              onClick={() => setShowAllReplies(true)}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {hiddenRepliesCount} {hiddenRepliesCount === 1 ? 'ответ' : hiddenRepliesCount < 5 ? 'ответа' : 'ответов'}
            </Button>
          )}
          
          {/* Кнопка "Свернуть" для скрытия показанных комментариев */}
          {hasMoreThanTwoReplies && showAllReplies && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground gap-1.5 -ml-2"
              onClick={() => setShowAllReplies(false)}
            >
              Свернуть
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
