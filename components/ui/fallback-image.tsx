"use client";

import { useState } from "react";

interface FallbackImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallback: React.ReactNode;
}

export function FallbackImage({ src, alt, fallback, className, ...props }: FallbackImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src || undefined}
      alt={alt || ""}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}
