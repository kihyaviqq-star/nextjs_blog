import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { FooterLayout } from "./footer-layout";

// Cache the settings fetch to avoid duplicate queries
const getFooterSettings = cache(async () => {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: { siteName: true, footerText: true, homeSubtitle: true },
    });
    return settings || null;
  } catch (error) {
    console.error("Failed to fetch footer settings:", error);
    return null;
  }
});

// Server component for server pages
export async function Footer() {
  const settings = await getFooterSettings();
  const currentYear = new Date().getFullYear();

  const siteName = settings?.siteName || "Softo.ru";
  const description = settings?.footerText || settings?.homeSubtitle || "Пульс нейросетей: технологии, которые меняют будущее.";

  return (
    <FooterLayout 
      siteName={siteName} 
      description={description} 
      currentYear={currentYear} 
    />
  );
}

// Client component wrapper for client pages
export { FooterClient } from "./footer-client";
