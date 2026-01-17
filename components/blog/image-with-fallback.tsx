'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

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
  showPlaceholder?: boolean;
  placeholderClassName?: string;
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
  showPlaceholder = true,
  placeholderClassName = '',
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  if (hasError && showPlaceholder) {
    return (
      <div className={`flex flex-col items-center justify-center bg-secondary text-muted-foreground ${placeholderClassName}`}>
        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
        <span className="text-xs opacity-50">Изображение не загружено</span>
      </div>
    );
  }

  if (hasError) {
    return null;
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
      }}
    />
  );
}
