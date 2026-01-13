"use client";

import { useEffect } from "react";

interface ViewIncrementerProps {
  slug: string;
}

export function ViewIncrementer({ slug }: ViewIncrementerProps) {
  useEffect(() => {
    // Increment view count when component mounts
    fetch(`/api/posts/${slug}/views`, { method: "POST" }).catch((error) => {
      console.error("Failed to increment view count:", error);
    });
  }, [slug]);

  // This component doesn't render anything
  return null;
}
