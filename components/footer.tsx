"use client";

import { useEffect, useState } from "react";

export function Footer() {
  const [footerText, setFooterText] = useState("Сделано с ❤ для всех, кто интересуется ИИ");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.footerText) {
            setFooterText(data.footerText);
          }
        }
      } catch (error) {
        console.error("Failed to fetch footer settings:", error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>
            © 2026 ai-stat.ru — Все права защищены
          </div>
          <div className="text-center md:text-right">
            {footerText}
          </div>
        </div>
      </div>
    </footer>
  );
}
