"use client";

import { useCompare } from "@/lib/compare-store";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight, X, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompareBar() {
  const { items, removeItem, clear } = useCompare();

  if (items.length === 0) return null;

  const isAi = items[0]?.isAi ?? true;
  const compareUrl = isAi
    ? `/tools/compare?ids=${items.map((i) => i.id).join(",")}`
    : `/software/compare?ids=${items.map((i) => i.id).join(",")}`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-xl shadow-2xl ring-1 ring-primary/20">
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-[60%] sm:max-w-[70%]">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-secondary/80 border border-border text-xs shrink-0"
            >
              {item.logoUrl ? (
                <Image
                  src={item.logoUrl}
                  alt={item.name}
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-md object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                  {item.name.charAt(0)}
                </div>
              )}
              <span className="font-medium text-foreground max-w-[90px] truncate">
                {item.name}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-muted-foreground hover:text-destructive p-0.5 rounded-full transition-colors"
                aria-label={`Удалить ${item.name} из сравнения`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {items.length < 4 && (
            <div className="text-[11px] text-muted-foreground shrink-0 pl-1 hidden sm:inline">
              (до {4 - items.length} еще)
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-xs h-8 text-muted-foreground hover:text-destructive px-2"
          >
            Очистить
          </Button>

          <Button
            asChild
            size="sm"
            className="h-8 gap-1.5 shadow-md font-semibold text-xs sm:text-sm"
          >
            <Link href={compareUrl}>
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Сравнить ({items.length})</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
