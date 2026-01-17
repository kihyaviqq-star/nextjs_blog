import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { HeaderClient } from "./header-client";
export { HeaderClientWrapper } from "./header-client-wrapper";


// Cache the settings fetch to avoid duplicate queries
const getSiteSettings = cache(async () => {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: {
        siteName: true,
        logoUrl: true,
      },
    });
    return {
      siteName: settings?.siteName || null,
      logoUrl: settings?.logoUrl || null,
    };
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return {
      siteName: null,
      logoUrl: null,
    };
  }
});

// Server component for server pages
export async function Header() {
  const settings = await getSiteSettings();

  return (
    <HeaderClient 
      siteName={settings.siteName}
      logoUrl={settings.logoUrl}
    />
  );
}
