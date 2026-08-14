"use client";

import { useState } from "react";
import Image from "next/image";

interface FallbackImageProps {
  src?: string | null;
  alt?: string;
  fallback: React.ReactNode;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

export function FallbackImage({
  src,
  alt = "",
  fallback,
  className,
  width = 64,
  height = 64,
  fill = false,
}: FallbackImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <>{fallback}</>;
  }

  // If using fill mode
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        onError={() => setError(true)}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      unoptimized
    />
  );
}
