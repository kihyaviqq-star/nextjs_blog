"use client";

import { useCompare, CompareItem } from "@/lib/compare-store";
import { ArrowLeftRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CompareButtonProps {
  item: CompareItem;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function CompareButton({
  item,
  variant = "outline",
  size = "sm",
  showLabel = true,
  className,
}: CompareButtonProps) {
  const { isInCompare, addItem } = useCompare();
  const inCompare = isInCompare(item.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(item);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={cn(
        "gap-1.5 transition-all duration-200",
        inCompare && "border-primary text-primary bg-primary/10",
        className
      )}
      title={inCompare ? "Убрать из сравнения" : "Добавить к сравнению"}
      aria-label={inCompare ? "Убрать из сравнения" : "Добавить к сравнению"}
    >
      {inCompare ? (
        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
      ) : (
        <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
      )}
      {showLabel && (
        <span className="text-xs">
          {inCompare ? "В сравнении" : "Сравнить"}
        </span>
      )}
    </Button>
  );
}
