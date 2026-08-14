import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { CompareProvider } from "@/lib/compare-store";
import { CompareBar } from "@/components/tools/compare-bar";
import { Toaster } from "@/components/ui/sonner";
import { MetadataUpdater } from "@/components/metadata-updater";
import { YandexMetrika } from "@/components/YandexMetrika";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

async function getBaseUrlFromRequest(): Promise<string> {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
  if (envBase) return envBase;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}

function normalizePathOrUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  // ensure leading slash for public assets like /uploads/...
  return value.startsWith("/") ? value : `/${value}`;
}

function toAbsoluteUrl(baseUrl: string, value?: string | null): string | undefined {
  const normalized = normalizePathOrUrl(value);
  if (!normalized) return undefined;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return normalized;
  try {
    return new URL(normalized, baseUrl).toString();
  } catch {
    return normalized;
  }
}

// Generate metadata with site settings
export async function generateMetadata(): Promise<Metadata> {
  // Create default if not exists using atomic upsert to prevent race conditions during build
  let settings: any = { siteName: "Blog", metaDescription: "Информационный портал о последних новостях и разработках в области искусственного интеллекта", faviconUrl: null, logoUrl: null };
  try {
    settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
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
  } catch (e) {
    console.warn("Database unavailable during build. Using default metadata settings.");
  }

  const siteName = settings.siteName || "";
  const siteDescription = settings.metaDescription || "";
  const siteUrl = await getBaseUrlFromRequest();
  const ogImage =
    toAbsoluteUrl(siteUrl, settings.logoUrl) || toAbsoluteUrl(siteUrl, "/og-default.jpg")!;

  // Check if indexing is allowed (default: false - site is closed from indexing)
  const allowIndexing = process.env.ALLOW_INDEXING === 'true';

  const metadataBase = (() => {
    try {
      return new URL(siteUrl);
    } catch {
      return new URL("http://localhost:3000");
    }
  })();

  const metadata: Metadata = {
    title: {
      template: `%s | ${siteName}`,
      default: siteName,
    },
    description: siteDescription,
    metadataBase,
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
    const favicon = toAbsoluteUrl(siteUrl, settings.faviconUrl) || normalizePathOrUrl(settings.faviconUrl);
    metadata.icons = {
      icon: favicon,
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
  let settings: any = null;
  try {
    settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: {
        siteName: true,
        metaDescription: true,
        logoUrl: true,
      },
    });
  } catch (e) {
    console.warn("Database unavailable during build. Using default Schema.org settings.");
  }

  const siteName = settings?.siteName || "Blog";
  const siteUrl = await getBaseUrlFromRequest();
  const logoUrl =
    toAbsoluteUrl(siteUrl, settings?.logoUrl) || toAbsoluteUrl(siteUrl, "/og-default.jpg")!;

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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <CompareProvider>
              <MetadataUpdater />
              {children}
              <CompareBar />
              <Toaster richColors position="top-right" />
            </CompareProvider>
          </ThemeProvider>
        </SessionProvider>
        {/* Analytics */}
        <GoogleAnalytics />
        <YandexMetrika />
      </body>
    </html>
  );
}
