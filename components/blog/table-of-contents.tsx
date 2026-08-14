"use client";

import { useEffect, useState, useMemo } from "react";
import { List, ChevronDown, ChevronRight, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  blocks?: any[];
  className?: string;
}

function cleanHeadingToId(text: string): string {
  const plain = text.replace(/<[^>]+>/g, "").trim().toLowerCase();
  return plain
    .replace(/[^\w\u0400-\u04FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export function TableOfContents({ blocks = [], className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);

  // Extract headings from blocks
  const items: TOCItem[] = useMemo(() => {
    if (!blocks || !Array.isArray(blocks)) return [];
    return blocks
      .filter((b) => b && b.type === "header" && b.data && b.data.text)
      .map((b) => {
        const rawText = b.data.text.replace(/<[^>]+>/g, "").trim();
        const id = cleanHeadingToId(b.data.text) || b.id;
        const level = b.data.level || 2;
        return { id, text: rawText, level };
      })
      .filter((item) => item.text.length > 0);
  }, [blocks]);

  // Set up IntersectionObserver for scroll-spy
  useEffect(() => {
    if (items.length === 0) return;

    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Choose the topmost visible entry
          const sorted = visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          setActiveId(sorted[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0.1,
      }
    );

    headingElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  const scrollToHeading = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const topOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveId(id);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/60 backdrop-blur p-4 transition-all duration-200 shadow-sm",
        className
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-semibold text-sm tracking-tight text-foreground/90 hover:text-primary transition-colors mb-2"
        aria-label="Переключить оглавление"
      >
        <span className="flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-primary" />
          Содержание статьи
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {items.length} разд.
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
      </button>

      {isOpen && (
        <nav className="mt-3 space-y-1 text-sm max-h-[70vh] overflow-y-auto pr-1">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => scrollToHeading(e, item.id)}
                className={cn(
                  "block py-1.5 px-2.5 rounded-md text-xs sm:text-sm transition-all duration-150 border-l-2 leading-snug",
                  item.level === 3 ? "ml-3 text-muted-foreground" : "font-medium",
                  isActive
                    ? "border-primary text-primary bg-primary/10 font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )}
              >
                {item.text}
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
}
