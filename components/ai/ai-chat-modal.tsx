"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, MessageSquare, Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { FallbackImage } from "@/components/ui/fallback-image";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChatModal({ tool }: { tool: any }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState(5);
  const scrollRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = `ai_chat_requests_${tool.id}`;

  useEffect(() => {
    if (open) {
      // Load remaining requests from local storage
      const stored = localStorage.getItem(STORAGE_KEY);
      let currentRemaining = 5;
      if (stored) {
        currentRemaining = parseInt(stored, 10);
        setRemainingRequests(currentRemaining);
      }
      
      const storedMessages = localStorage.getItem(`${STORAGE_KEY}_messages`);
      if (storedMessages) {
        try {
          setMessages(JSON.parse(storedMessages));
        } catch(e) {}
      } else {
        // Initial greeting
        setMessages([
          {
            role: "assistant",
            content: `Привет! Я **${tool.name}**. Чем могу помочь? У вас есть ${currentRemaining} бесплатных запросов для тестирования.`
          }
        ]);
      }
    }
  }, [open, tool.id, tool.name, STORAGE_KEY]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || remainingRequests <= 0) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          modelId: tool.slug,
          toolName: tool.name
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      
      const assistantMessage: Message = { role: "assistant", content: data.reply || "No response" };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      
      // Update requests count
      const newRemaining = remainingRequests - 1;
      setRemainingRequests(newRemaining);
      localStorage.setItem(STORAGE_KEY, newRemaining.toString());
      localStorage.setItem(`${STORAGE_KEY}_messages`, JSON.stringify(updatedMessages));

    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: "assistant", content: "Произошла ошибка при обращении к модели. Возможно, API недоступен или модель не найдена." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="lg" className="rounded-full shadow-md font-medium px-8 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20 hover:scale-105 transition-transform duration-300">
          <Sparkles className="w-4 h-4 mr-2" />
          Попробовать
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-border overflow-hidden">
              <FallbackImage 
                src={tool.logoUrl || undefined} 
                alt={tool.name} 
                className="w-full h-full object-contain p-1" 
                fallback={<Bot className="w-4 h-4 text-primary" />} 
              />
            </div>
            <div className="flex flex-col text-left">
              <span>{tool.name}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {remainingRequests > 0 ? `Осталось запросов: ${remainingRequests}/5` : "Лимит запросов исчерпан"}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="flex flex-col gap-4 pb-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border'}`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                    : 'bg-muted/50 border border-border/50 rounded-tl-sm'
                }`}>
                  {m.role === 'user' ? (
                    m.content
                  ) : (
                    <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-pre:my-1 max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 flex-row">
                <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-muted/50 border border-border/50 rounded-tl-sm flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 relative"
          >
            <Input 
              value={input}
              onChange={e => setInput(e.target.value.slice(0, 1000))} // 1000 chars limit
              placeholder={remainingRequests > 0 ? "Введите сообщение..." : "Лимит исчерпан"}
              disabled={isLoading || remainingRequests <= 0}
              className="flex-1 rounded-full pr-12 bg-muted/50 border-border/50 focus-visible:ring-primary/20"
              autoComplete="off"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isLoading || remainingRequests <= 0}
              className="absolute right-1 w-8 h-8 rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-center mt-2 text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <MessageSquare className="w-3 h-3" />
            Тестовый чат через OpenRouter API
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
