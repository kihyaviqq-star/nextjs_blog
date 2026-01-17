
"use client";

import { useState, useEffect } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchComments = async (pageNum: number) => {
    try {
      if (!postId) {
        console.error("postId is missing in fetchComments");
        return;
      }
      const res = await fetch(`/api/comments?postId=${postId}&page=${pageNum}&limit=15`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Failed to fetch comments: ${res.status} ${res.statusText}`, errorText);
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      
      if (pageNum === 1) {
        setComments(data.comments);
      } else {
        setComments((prev) => [...prev, ...data.comments]);
      }
      
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchComments(nextPage);
  };

  // Рекурсивная функция для добавления ответа к комментарию на любом уровне вложенности
  const addReplyToComment = (comments: any[], parentId: string, newReply: any): any[] => {
    return comments.map((c) => {
      // Если это родительский комментарий, добавляем ответ
      if (c.id === parentId) {
        return {
          ...c,
          replies: [...(c.replies || []), { ...newReply, replies: [] }]
        };
      }
      // Если у комментария есть ответы, рекурсивно ищем родителя в них
      if (c.replies && c.replies.length > 0) {
        return {
          ...c,
          replies: addReplyToComment(c.replies, parentId, newReply)
        };
      }
      return c;
    });
  };

  const handleNewComment = (comment: any) => {
    console.log("handleNewComment called with:", comment);
    // If comment has parentId, it's a reply - need to update the parent comment's replies
    if (comment.parentId) {
      setComments((prev) => {
        // Проверяем, нет ли уже этого комментария в дереве (избегаем дублирования)
        const findCommentInTree = (comments: any[], id: string): boolean => {
          for (const c of comments) {
            if (c.id === id) return true;
            if (c.replies && c.replies.length > 0) {
              if (findCommentInTree(c.replies, id)) return true;
            }
          }
          return false;
        };
        
        // Если комментарий уже есть, не добавляем его снова
        if (findCommentInTree(prev, comment.id)) {
          console.log("Comment already exists in tree, skipping");
          return prev;
        }
        
        const updated = addReplyToComment(prev, comment.parentId, comment);
        console.log("Updated comments with reply:", updated);
        return updated;
      });
    } else {
      // Top-level comment - проверяем, нет ли уже этого комментария
      setComments((prev) => {
        const exists = prev.some((c) => c.id === comment.id);
        if (exists) {
          console.log("Top-level comment already exists, skipping");
          return prev;
        }
        return [{ ...comment, replies: [] }, ...prev];
      });
    }
    setTotal((prev) => prev + 1);
  };

  // Обработчик добавления ответа на любом уровне (для обновления главного состояния)
  // Этот обработчик вызывается только для синхронизации главного состояния,
  // но не должен дублировать обновления, которые уже были сделаны локально
  const handleReplyAdded = (newReply: any) => {
    if (newReply.parentId) {
      // Используем функциональное обновление для правильной синхронизации
      setComments((prev) => {
        // Проверяем, есть ли уже этот комментарий в дереве
        const findCommentInTree = (comments: any[], id: string): boolean => {
          for (const comment of comments) {
            if (comment.id === id) return true;
            if (comment.replies && comment.replies.length > 0) {
              if (findCommentInTree(comment.replies, id)) return true;
            }
          }
          return false;
        };
        
        // Если комментарий уже есть, не добавляем его снова
        if (findCommentInTree(prev, newReply.id)) {
          return prev;
        }
        
        // Иначе добавляем к правильному родителю
        return addReplyToComment(prev, newReply.parentId, newReply);
      });
      setTotal((prev) => prev + 1);
    }
  };

  return (
    <section className="mt-16 pt-16 border-t border-border" id="comments">
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-3xl font-bold">Комментарии</h2>
        <div className="px-3 py-1 rounded-full bg-secondary text-sm font-medium flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4" />
          {total}
        </div>
      </div>

      <div className="mb-10">
        <CommentForm postId={postId} onSuccess={handleNewComment} />
      </div>

      <div className="space-y-8">
        {comments.map((comment) => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            postId={postId}
            onReplyAdded={handleReplyAdded}
            onCommentDeleted={(deletedId) => {
              // Remove deleted comment from the list
              const removeComment = (commentsList: any[]): any[] => {
                return commentsList
                  .filter((c) => c.id !== deletedId)
                  .map((c) => {
                    if (c.replies && c.replies.length > 0) {
                      return {
                        ...c,
                        replies: removeComment(c.replies)
                      };
                    }
                    return c;
                  });
              };
              setComments((prev) => removeComment(prev));
              setTotal((prev) => Math.max(0, prev - 1));
            }}
          />
        ))}

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && hasMore && (
          <div className="text-center pt-4">
            <Button variant="outline" onClick={loadMore}>
              Загрузить еще
            </Button>
          </div>
        )}

        {!isLoading && comments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-secondary/30 rounded-lg">
                <p>Комментариев пока нет. Будьте первым!</p>
            </div>
        )}
      </div>
    </section>
  );
}
