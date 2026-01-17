
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

  const handleNewComment = (comment: any) => {
    console.log("handleNewComment called with:", comment);
    // If comment has parentId, it's a reply - need to update the parent comment's replies
    if (comment.parentId) {
      const updateCommentWithReply = (comments: any[]): any[] => {
        return comments.map((c) => {
          if (c.id === comment.parentId) {
            console.log(`Found parent comment ${c.id}, adding reply`);
            return {
              ...c,
              replies: [...(c.replies || []), { ...comment, replies: [] }]
            };
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: updateCommentWithReply(c.replies)
            };
          }
          return c;
        });
      };
      setComments((prev) => {
        const updated = updateCommentWithReply(prev);
        console.log("Updated comments:", updated);
        return updated;
      });
    } else {
      // Top-level comment
      setComments((prev) => [{ ...comment, replies: [] }, ...prev]);
    }
    setTotal((prev) => prev + 1);
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
            onReplyAdded={() => {}} // We might not need to update the main list for deep replies
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
