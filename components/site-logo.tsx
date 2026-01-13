"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SiteSettings {
  siteName: string;
  logoUrl: string | null;
}

export function SiteLogo() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: "AI Al-Stat",
    logoUrl: null,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings({
            siteName: data.siteName || "AI Al-Stat",
            logoUrl: data.logoUrl,
          });
        }
      } catch (error) {
        console.error("Failed to fetch site settings:", error);
      }
    };

    fetchSettings();
  }, []);

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
