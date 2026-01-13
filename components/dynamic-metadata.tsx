"use client";

import { useEffect } from "react";

export function DynamicMetadata() {
  useEffect(() => {
    const updateMetadata = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          
          // Update document title
          if (data.siteName) {
            document.title = data.siteName;
          }
          
          // Update meta description
          if (data.metaDescription) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.setAttribute('name', 'description');
              document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', data.metaDescription);
          }
          
          // Update favicon
          if (data.faviconUrl) {
            let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (!faviconLink) {
              faviconLink = document.createElement('link');
              faviconLink.setAttribute('rel', 'icon');
              document.head.appendChild(faviconLink);
            }
            faviconLink.href = data.faviconUrl;
          }
        }
      } catch (error) {
        console.error("Failed to update metadata:", error);
      }
    };

    updateMetadata();
  }, []);

  return null;
}
