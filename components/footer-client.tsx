"use client";

import { useEffect, useState } from "react";
import { FooterLayout } from "./footer-layout";

interface FooterClientProps {
  footerText?: string | null;
}

export function FooterClient({ footerText: initialFooterText }: FooterClientProps = {}) {
  const [siteName, setSiteName] = useState<string>("Softo.ru");
  const [description, setDescription] = useState<string>("Пульс нейросетей: технологии, которые меняют будущее.");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.siteName) setSiteName(data.siteName);
          
          const desc = initialFooterText || data.footerText || data.homeSubtitle;
          if (desc) setDescription(desc);
        }
      } catch (error) {
        console.error("Failed to fetch footer settings:", error);
      }
    };

    fetchSettings();
  }, [initialFooterText]);

  return (
    <FooterLayout 
      siteName={siteName} 
      description={description} 
      currentYear={currentYear} 
    />
  );
}
