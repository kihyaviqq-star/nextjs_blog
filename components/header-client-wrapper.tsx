"use client";

import { useEffect, useState } from "react";
import { HeaderClient } from "./header-client";

export function HeaderClientWrapper() {
  const [settings, setSettings] = useState<{
    siteName: string | null;
    logoUrl: string | null;
  }>({
    siteName: null,
    logoUrl: null,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings({
            siteName: data.siteName || null,
            logoUrl: data.logoUrl || null,
          });
        }
      } catch (error) {
        console.error("Failed to fetch site settings:", error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <HeaderClient 
      siteName={settings.siteName}
      logoUrl={settings.logoUrl}
    />
  );
}
