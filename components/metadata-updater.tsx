"use client";

import { useEffect } from "react";

export function MetadataUpdater() {
  useEffect(() => {
    const updateMetadata = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          
          // Don't update title - it's already set correctly by generateMetadata
          // Only update description and favicon if they're not already set
          
          // Update meta description (only if not already set by generateMetadata)
          if (data.metaDescription) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
              // Only update if current description is the default one
              const currentDesc = metaDesc.getAttribute('content');
              if (!currentDesc || currentDesc === "Информационный портал о последних новостях и разработках в области искусственного интеллекта") {
                metaDesc.setAttribute('content', data.metaDescription);
              }
            } else {
              metaDesc = document.createElement('meta');
              metaDesc.setAttribute('name', 'description');
              metaDesc.setAttribute('content', data.metaDescription);
              document.head.appendChild(metaDesc);
            }
          }
          
          // Update favicon
          if (data.faviconUrl) {
            let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (!faviconLink) {
              faviconLink = document.createElement('link');
              faviconLink.setAttribute('rel', 'icon');
              document.head.appendChild(faviconLink);
            }
            // Normalize favicon URL:
            // - ensure leading slash for local paths
            // - if we are on https and URL is http, upgrade to https to avoid mixed content
            const raw: string = data.faviconUrl;
            const normalized =
              raw.startsWith("http://") || raw.startsWith("https://")
                ? raw
                : raw.startsWith("/")
                  ? raw
                  : `/${raw}`;

            let resolved = normalized;
            try {
              if (!resolved.startsWith("http://") && !resolved.startsWith("https://")) {
                resolved = new URL(resolved, window.location.origin).toString();
              }
              // Mixed content guard (best-effort)
              if (window.location.protocol === "https:" && resolved.startsWith("http://")) {
                const u = new URL(resolved);
                if (u.hostname === window.location.hostname) {
                  u.protocol = "https:";
                  resolved = u.toString();
                }
              }
            } catch {
              // ignore
            }

            faviconLink.href = resolved;
          }
        }
      } catch (error) {
        // Silently fail - don't break the app
        console.error("Failed to update metadata:", error);
      }
    };

    // Small delay to avoid blocking initial render
    const timer = setTimeout(updateMetadata, 100);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
