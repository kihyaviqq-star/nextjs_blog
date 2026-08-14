"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface CompareItem {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  pricing?: string | null;
  isAi: boolean;
  categoryName?: string | null;
  shortDesc?: string | null;
}

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => boolean;
  removeItem: (id: string) => void;
  clear: () => void;
  isInCompare: (id: string) => boolean;
}

const MAX_COMPARE_ITEMS = 4;
const STORAGE_KEY = "ai_blog_compare_items";

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // ignore
      }
    }
  }, [items, isInitialized]);

  const addItem = (item: CompareItem): boolean => {
    if (items.some((i) => i.id === item.id)) {
      removeItem(item.id);
      return false;
    }

    if (items.length >= MAX_COMPARE_ITEMS) {
      toast.error(`Можно сравнивать не более ${MAX_COMPARE_ITEMS} инструментов одновременно.`);
      return false;
    }

    // Ensure we are comparing same type (AI with AI or Software with Software)
    if (items.length > 0 && items[0].isAi !== item.isAi) {
      toast.error(
        item.isAi
          ? "Нельзя сравнивать AI-инструменты с обычными программами. Очистите список сравнения."
          : "Нельзя сравнивать обычные программы с AI-сервисами. Очистите список сравнения."
      );
      return false;
    }

    setItems((prev) => [...prev, item]);
    toast.success(`«${item.name}» добавлен к сравнению`);
    return true;
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clear = () => {
    setItems([]);
  };

  const isInCompare = (id: string) => {
    return items.some((i) => i.id === id);
  };

  return (
    <CompareContext.Provider value={{ items, addItem, removeItem, clear, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
