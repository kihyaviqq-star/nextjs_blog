"use client";

import { useEffect, useState } from "react";

export function FooterClient() {
  const [footerText, setFooterText] = useState("Сделано с ❤️");
  const currentYear = new Date().getFullYear();

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
    <footer className="border-t border-zinc-800 dark:border-zinc-800 mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-sm text-zinc-500 dark:text-gray-400">
          <div className="text-center sm:text-left">
            © {currentYear} — Все права защищены
          </div>
          <div className="text-center sm:text-right">
            {footerText}
          </div>
        </div>
      </div>
    </footer>
  );
}
