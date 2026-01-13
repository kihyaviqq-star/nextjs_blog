"use client";

import { useRef, useState, MouseEvent, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Prevent white flash by using dark background initially
  const baseStyle = mounted
    ? undefined
    : { backgroundColor: "rgb(24 24 27 / 0.5)", borderColor: "rgb(39 39 42)" };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative rounded-lg border transition-all duration-300 overflow-hidden",
        // Light mode styles
        "bg-white/80 border-zinc-200",
        // Dark mode styles
        "dark:bg-zinc-900/50 dark:border-zinc-800",
        // Hover states
        isHovered && "border-zinc-300 dark:border-zinc-700",
        className
      )}
      style={{
        ...baseStyle,
        ...(isHovered && mounted
          ? {
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%), rgb(24 24 27 / 0.5)`,
            }
          : {}),
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
