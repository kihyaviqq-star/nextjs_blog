"use client";

import { useEffect, useState } from "react";

interface FooterClientProps {
  footerText?: string | null;
}

export function FooterClient({ footerText: initialFooterText }: FooterClientProps = {}) {
  const [footerText, setFooterText] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Если footerText передан через пропсы, используем его и не делаем запрос к API
    if (initialFooterText !== undefined) {
      setFooterText(initialFooterText || null);
      return;
    }

    // Если footerText не передан, загружаем через API (для обратной совместимости)
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setFooterText(data.footerText || null);
        }
      } catch (error) {
        console.error("Failed to fetch footer settings:", error);
        setFooterText(null);
      }
    };

    fetchSettings();
  }, [initialFooterText]);

  // Используем переданное значение напрямую, если оно есть (для SSR и начального рендера)
  const displayText = initialFooterText !== undefined 
    ? initialFooterText
    : footerText;

  return (
    <footer className="border-t border-zinc-800 dark:border-zinc-800 mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-sm text-zinc-500 dark:text-gray-400">
          <div className="text-center sm:text-left">
            © {currentYear} — Все права защищены
          </div>
          {displayText && (
            <div className="text-center sm:text-right">
              {displayText}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
