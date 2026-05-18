import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getOptimizedImageUrl,
  generateSrcSet,
  generateSizes,
  getPlaceholderUrl,
  getImageVariantUrl,
  IMAGE_SIZES,
} from '../../utils/image';

type ImageSize = keyof typeof IMAGE_SIZES;

/**
 * priority prop:
 *   'high' — eager loading, fetchpriority=high, preload link injected (use for first ProductDetail slide)
 *   'low'  — lazy loading, decoding=async (default — use for vitrine/cards)
 *   'auto' — browser default
 *
 * Legacy boolean priority=true is mapped to 'high' for backward compatibility.
 */
type ImagePriority = 'high' | 'low' | 'auto';

interface OptimizedImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  size?: ImageSize;
  sizes?: string;
  /** 'high' | 'low' | 'auto' — or boolean true/false for legacy compat */
  priority?: ImagePriority | boolean;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'skeleton' | 'none';
  quality?: number;
  useSrcSet?: boolean;
  srcSetSizes?: ImageSize[];
}

function resolvePriority(p: ImagePriority | boolean | undefined): ImagePriority {
  if (p === true) return 'high';
  if (p === false) return 'low';
  return (p as ImagePriority) || 'low';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  size = 'medium',
  sizes,
  priority = 'low',
  aspectRatio,
  objectFit = 'cover',
  onLoad,
  onError,
  placeholder = 'skeleton',
  quality = 75,
  useSrcSet = true,
  srcSetSizes = ['thumbnail', 'small', 'medium', 'large'],
}) => {
  const resolvedPriority = resolvePriority(priority);
  const isHigh = resolvedPriority === 'high';

  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(isHigh);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const optimizedSrc = src ? getOptimizedImageUrl(src, size, { quality }) : '';
  const webpSrcSet = src && useSrcSet ? generateSrcSet(src, srcSetSizes, quality) : '';
  const defaultSizes = sizes || generateSizes();
  const placeholderSrc = getPlaceholderUrl(
    IMAGE_SIZES[size].width,
    IMAGE_SIZES[size].height
  );

  useEffect(() => {
    if (isHigh) {
      setIsInView(true);
      if (src) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        // Preload the card variant (600w) as a sensible default for high-priority images
        link.href = getImageVariantUrl(src, 'card') || optimizedSrc;
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
  }, [isHigh, src, optimizedSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (imgRef.current && src && !hasError) {
      // Clear srcset and try the plain original URL as fallback
      imgRef.current.srcset = '';
      if (!imgRef.current.src.includes(src)) {
        imgRef.current.src = src;
        return;
      }
    }
    setHasError(true);
    onError?.();
  }, [onError, hasError, src]);

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
        <div className="absolute inset-0 img-shimmer" />
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
        <picture className="contents">
          {webpSrcSet && (
            <source
              srcSet={webpSrcSet}
              sizes={defaultSizes}
              type="image/webp"
            />
          )}
          <img
            ref={imgRef}
            src={optimizedSrc}
            sizes={defaultSizes}
            alt={alt}
            width={IMAGE_SIZES[size].width}
            height={IMAGE_SIZES[size].height}
            loading={isHigh ? 'eager' : 'lazy'}
            decoding={isHigh ? 'sync' : 'async'}
            fetchPriority={isHigh ? 'high' : (resolvedPriority === 'auto' ? 'auto' : 'low')}
            onLoad={handleLoad}
            onError={handleError}
            className={`
              w-full h-full ${objectFitClass}
              transition-opacity duration-700 ease-out
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
            `}
          />
        </picture>
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
