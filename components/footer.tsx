import { prisma } from "@/lib/prisma";
import { cache } from "react";

// Cache the settings fetch to avoid duplicate queries
const getFooterText = cache(async () => {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: { footerText: true },
    });
    return settings?.footerText || "Сделано с ❤️";
  } catch (error) {
    console.error("Failed to fetch footer settings:", error);
    return "Сделано с ❤️";
  }
});

// Server component for server pages
export async function Footer() {
  const footerText = await getFooterText();
  const currentYear = new Date().getFullYear();

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

// Client component wrapper for client pages
export { FooterClient } from "./footer-client";
