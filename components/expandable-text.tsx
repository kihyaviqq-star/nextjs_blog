"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  children: React.ReactNode;
  maxHeight?: number;
  className?: string;
}

export function ExpandableText({ children, maxHeight = 400, className }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <div 
        className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out relative",
          isExpanded ? "max-h-[5000px]" : `max-h-[${maxHeight}px]`
        )}
        style={!isExpanded ? { maxHeight: `${maxHeight}px` } : undefined}
      >
        {children}
        
        {/* Gradient Overlay */}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        )}
      </div>

      <div className="flex justify-center mt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-6 py-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-colors border border-border/50 text-sm shadow-sm"
        >
          {isExpanded ? (
            <>Скрыть полное описание <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Читать полное описание <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
