import { HeaderClient } from "./header-client";
import { prisma } from "@/lib/prisma";

export async function Header() {
  // Fetch settings on server
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

  return (
    <HeaderClient 
      siteName={settings.siteName || "Blog"}
      logoUrl={settings.logoUrl}
    />
  );
}
