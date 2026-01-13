import Link from "next/link";
import { prisma } from "@/lib/prisma";

export async function SiteLogoServer() {
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
    <Link 
      href="/" 
      className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0 z-10"
    >
      {settings.logoUrl && (
        <img 
          src={settings.logoUrl} 
          alt={settings.siteName} 
          className="h-8 w-auto"
        />
      )}
      <span className="text-xl font-semibold">{settings.siteName}</span>
    </Link>
  );
}
