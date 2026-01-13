import { HeaderClient } from "./header-client";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

// Cache the settings fetch to avoid multiple queries
const getSiteSettings = cache(async () => {
  let settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  // Create default if not exists
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        id: "default",
        siteName: "Blog",
      },
    });
  }

  return settings;
});

export async function Header() {
  const settings = await getSiteSettings();

  return (
    <HeaderClient 
      siteName={settings.siteName || "Blog"}
      logoUrl={settings.logoUrl}
    />
  );
}
