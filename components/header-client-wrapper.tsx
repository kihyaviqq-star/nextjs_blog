"use client";

import { useEffect, useState } from "react";
import { HeaderClient } from "./header-client";

interface HeaderClientWrapperProps {
  siteName?: string | null;
  logoUrl?: string | null;
}

export function HeaderClientWrapper({ 
  siteName: initialSiteName, 
  logoUrl: initialLogoUrl 
}: HeaderClientWrapperProps = {}) {
  const [settings, setSettings] = useState<{
    siteName: string | null;
    logoUrl: string | null;
  }>({
    siteName: initialSiteName ?? null,
    logoUrl: initialLogoUrl ?? null,
  });
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Если данные переданы через пропсы, используем их и не делаем запрос к API
    if (initialSiteName !== undefined || initialLogoUrl !== undefined) {
      setSettings({
        siteName: initialSiteName ?? null,
        logoUrl: initialLogoUrl ?? null,
      });
      return;
    }

    // Если данные не переданы и еще не загружали, загружаем через API (для обратной совместимости)
    if (!hasFetched) {
      setHasFetched(true);
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
    }
  }, [initialSiteName, initialLogoUrl, hasFetched]);

  // Используем переданные значения напрямую для отображения (избегаем мигания)
  // Если пропсы переданы, используем их сразу, иначе используем состояние
  const displaySiteName = initialSiteName !== undefined 
    ? (initialSiteName || null)
    : settings.siteName;
  const displayLogoUrl = initialLogoUrl !== undefined 
    ? (initialLogoUrl || null)
    : settings.logoUrl;

  return (
    <HeaderClient 
      siteName={displaySiteName}
      logoUrl={displayLogoUrl}
    />
  );
}
