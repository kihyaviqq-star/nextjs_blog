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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
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

  // Get hover gradient based on theme
  const getHoverGradient = () => {
    const baseColor = isDark ? 'rgb(24 24 27 / 0.5)' : 'rgb(255 255 255 / 0.8)';
    const gradientColor = isDark 
      ? 'rgba(59, 130, 246, 0.15)' // Blue for dark mode
      : 'rgba(59, 130, 246, 0.1)'; // Lighter blue for light mode
    
    return `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${gradientColor}, transparent 40%), ${baseColor}`;
  };

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
        ...(isHovered && mounted
          ? {
              background: getHoverGradient(),
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
