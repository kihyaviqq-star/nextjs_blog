'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  unoptimized?: boolean;
  objectFit?: 'contain' | 'cover';
}

export function ImageWithFallback({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  className,
  style,
  priority,
  unoptimized,
  objectFit = 'cover',
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  if (hasError) {
    return null; // Скрываем изображение при ошибке загрузки
  }

  const imageStyle = {
    objectFit,
    ...style,
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      style={imageStyle}
      priority={priority}
      unoptimized={unoptimized}
      onError={(e) => {
        console.error('Image failed to load:', imgSrc);
        setHasError(true);
        // Можно также установить placeholder изображение:
        // setImgSrc('/placeholder-image.jpg');
      }}
    />
  );
}
