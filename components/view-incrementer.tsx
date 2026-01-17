"use client";

import { useEffect, useRef } from "react";

interface ViewIncrementerProps {
  slug: string;
}

export function ViewIncrementer({ slug }: ViewIncrementerProps) {
  const hasIncremented = useRef(false);
  const isIncrementing = useRef(false);

  useEffect(() => {
    // Предотвращаем множественные запросы
    if (hasIncremented.current || isIncrementing.current) {
      return;
    }

    // Проверяем в sessionStorage, был ли уже подсчитан просмотр в этой сессии
    const storageKey = `view_${slug}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) {
      return;
    }

    isIncrementing.current = true;

    // Increment view count when component mounts
    fetch(`/api/posts/${encodeURIComponent(slug)}/views`, { 
      method: "POST",
      credentials: 'same-origin'
    })
      .then((response) => {
        // Если успешно, сохраняем в sessionStorage
        if (response.ok || response.status === 429) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(storageKey, '1');
          }
          hasIncremented.current = true;
        }
      })
      .catch((error) => {
        // Тихо обрабатываем ошибки, не показываем в консоли
        // Rate limit ошибки (429) - это нормально, игнорируем
        if (error?.status !== 429) {
          // Только логируем неожиданные ошибки
          console.debug("View increment failed:", error);
        }
      })
      .finally(() => {
        isIncrementing.current = false;
      });
  }, [slug]);

  // This component doesn't render anything
  return null;
}
