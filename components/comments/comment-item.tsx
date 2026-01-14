
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, User, Reply } from "lucide-react";
import { CommentForm } from "./comment-form";
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
  level?: number;
}

export function CommentItem({ comment, postId, onReplyAdded, level = 0 }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);

  const handleReplySuccess = (newReply: Comment) => {
    setReplies([...replies, newReply]);
    setIsReplying(false);
    // Also notify parent to maybe update count or something (optional)
  };

  const hasReplies = replies && replies.length > 0;
  
  // Limit nesting visual indentation to avoid squeezing content too much
  const indentClass = level > 0 ? "ml-4 md:ml-12" : "";

  return (
    <div className={cn("group animate-in fade-in slide-in-from-top-2", level > 0 && "mt-4")}>
      <div className="flex gap-4">
        <Avatar className="w-10 h-10 border border-border">
          <AvatarImage src={comment.author.avatarUrl || ""} alt={comment.author.name || "User"} />
          <AvatarFallback className="bg-muted">
            <User className="w-5 h-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {comment.author.name || "Пользователь"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ru })}
              </span>
            </div>
          </div>

          <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {comment.content}
          </div>

          {comment.imageUrl && (
            <Dialog>
              <DialogTrigger asChild>
                <div className="mt-2 rounded-lg overflow-hidden border border-border w-fit max-w-[80px] cursor-zoom-in hover:opacity-90 transition-opacity">
                  <img 
                    src={comment.imageUrl} 
                    alt="Comment attachment" 
                    className="w-full h-auto object-cover max-h-[80px]"
                    loading="lazy"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-screen-lg w-auto p-0 bg-transparent border-none shadow-none">
                <DialogTitle className="sr-only">Просмотр изображения</DialogTitle>
                <div className="relative flex items-center justify-center w-full h-full">
                  <img 
                    src={comment.imageUrl} 
                    alt="Comment attachment full" 
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="flex items-center pt-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-muted-foreground hover:text-primary -ml-2 gap-1.5"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="w-3.5 h-3.5" />
              Ответить
            </Button>
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
          {replies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              postId={postId} 
              onReplyAdded={(newReply) => {
                 // Update the specific reply's replies if we were tracking deep state here
                 // But since we are recursive, the child CommentItem handles its own state.
                 // This callback is mostly for the parent to know something happened.
              }}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
