import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { MetadataUpdater } from "@/components/metadata-updater";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

// Generate metadata with site settings
export async function generateMetadata(): Promise<Metadata> {
  let settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      siteName: true,
      metaDescription: true,
      faviconUrl: true,
    },
  });

  // Create default if not exists
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: {
        id: "default",
        siteName: "Blog",
        metaDescription: "Информационный портал о последних новостях и разработках в области искусственного интеллекта",
      },
      select: {
        siteName: true,
        metaDescription: true,
        faviconUrl: true,
      },
    });
  }

  const metadata: Metadata = {
    title: settings.siteName || "Blog",
    description: settings.metaDescription || "Информационный портал о последних новостях и разработках в области искусственного интеллекта",
  };

  // Add favicon if available
  if (settings.faviconUrl) {
    metadata.icons = {
      icon: settings.faviconUrl,
    };
  }

  return metadata;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <MetadataUpdater />
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
