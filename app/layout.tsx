import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { MetadataUpdater } from "@/components/metadata-updater";
import { YandexMetrika } from "@/components/YandexMetrika";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
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
      logoUrl: true,
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
        logoUrl: true,
      },
    });
  }

  const siteName = settings.siteName || "";
  const siteDescription = settings.metaDescription || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const ogImage = settings.logoUrl 
    ? (settings.logoUrl.startsWith('http') ? settings.logoUrl : `${siteUrl}${settings.logoUrl}`)
    : `${siteUrl}/og-default.jpg`;

  // Check if indexing is allowed (default: false - site is closed from indexing)
  const allowIndexing = process.env.ALLOW_INDEXING === 'true';

  const metadata: Metadata = {
    title: {
      template: `%s | ${siteName}`,
      default: siteName,
    },
    description: siteDescription,
    metadataBase: new URL(siteUrl),
    // Block search engines from indexing if ALLOW_INDEXING is not 'true'
    robots: allowIndexing ? undefined : {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
    alternates: {
      canonical: './',
    },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: siteUrl,
      siteName: siteName,
      title: siteName,
      description: siteDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDescription,
      images: [ogImage],
    },
  };

  // Add favicon if available
  if (settings.faviconUrl) {
    metadata.icons = {
      icon: settings.faviconUrl,
    };
  }

  return metadata;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings for Schema.org
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      siteName: true,
      metaDescription: true,
      logoUrl: true,
    },
  });

  const siteName = settings?.siteName || "Blog";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const logoUrl = settings?.logoUrl 
    ? (settings.logoUrl.startsWith('http') ? settings.logoUrl : `${siteUrl}${settings.logoUrl}`)
    : `${siteUrl}/og-default.jpg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": siteName,
        "description": settings?.metaDescription || "Информационный портал о последних новостях и разработках в области искусственного интеллекта",
        "publisher": {
          "@id": `${siteUrl}/#organization`
        }
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": siteName,
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": logoUrl
        }
      }
    ]
  };

  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
        {/* Analytics */}
        <GoogleAnalytics />
        <YandexMetrika />
      </body>
    </html>
  );
}
