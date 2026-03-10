import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getOptimizedImageUrl,
  generateSrcSet,
  generateSizes,
  getPlaceholderUrl,
  getR2FallbackUrl,
  IMAGE_SIZES,
} from '../../utils/image';

type ImageSize = keyof typeof IMAGE_SIZES;

interface OptimizedImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  size?: ImageSize;
  sizes?: string;
  priority?: boolean;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'skeleton' | 'none';
  quality?: number;
  useSrcSet?: boolean;
  srcSetSizes?: ImageSize[];
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  size = 'medium',
  sizes,
  priority = false,
  aspectRatio,
  objectFit = 'cover',
  onLoad,
  onError,
  placeholder = 'skeleton',
  quality = 75,
  useSrcSet = true,
  srcSetSizes = ['thumbnail', 'small', 'medium', 'large'],
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [triedR2, setTriedR2] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const optimizedSrc = getOptimizedImageUrl(src, size, { quality });
  const srcSet = useSrcSet ? generateSrcSet(src, srcSetSizes, quality) : undefined;
  const defaultSizes = sizes || generateSizes();
  const placeholderSrc = getPlaceholderUrl(
    IMAGE_SIZES[size].width,
    IMAGE_SIZES[size].height
  );

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      if (src) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = optimizedSrc;
        link.setAttribute('fetchpriority', 'high');
        document.head.appendChild(link);
      }
      return;
    }

    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '150px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority, src, optimizedSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    // Try R2 fallback before giving up
    if (!triedR2 && src) {
      const r2Url = getR2FallbackUrl(src);
      if (r2Url && imgRef.current) {
        setTriedR2(true);
        imgRef.current.srcset = '';
        imgRef.current.src = r2Url;
        return;
      }
    }
    setHasError(true);
    onError?.();
  }, [onError, triedR2, src]);

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  }[objectFit];

  const showSkeleton = placeholder === 'skeleton' && !isLoaded && !hasError;
  const showBlur = placeholder === 'blur' && !isLoaded && !hasError;

  if (!src) {
    return (
      <div
        ref={containerRef}
        className={`bg-neutral-100 ${className}`}
        style={{ aspectRatio }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      {showSkeleton && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
      )}

      {showBlur && (
        <img
          src={placeholderSrc}
          alt=""
          className={`absolute inset-0 w-full h-full ${objectFitClass} blur-sm scale-110`}
          aria-hidden="true"
          role="presentation"
        />
      )}

      {isInView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet || undefined}
          sizes={srcSet ? defaultSizes : undefined}
          alt={alt}
          width={IMAGE_SIZES[size].width}
          height={IMAGE_SIZES[size].height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            w-full h-full ${objectFitClass}
            transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <span className="text-neutral-400 text-xs">Erro ao carregar</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
export type { OptimizedImageProps };

