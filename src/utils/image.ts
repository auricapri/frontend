/**
 * R2 WebP variant sizes generated at upload time by the backend pipeline.
 * thumb: 300w/q75, grid: 450w/q80, card: 600w/q80.
 * 'original' returns the URL unchanged.
 */
export type ImageVariantSize = 'thumb' | 'grid' | 'card' | 'original';

const R2_URL_PATTERN = /^https:\/\/pub-[a-f0-9]+\.r2\.dev\//;
const R2_PUBLIC_BASE = 'https://pub-efa0957776f14deea3bc267eb4ca9156.r2.dev';
const LEGACY_SUPABASE_HOST_PATTERN = /^https:\/\/zbrunudbdyuebtpxfnkd\.supabase\.co\/storage\/v1\/(?:object|render\/image)\/public\//;

/**
 * Rewrites URLs pointing at the deleted legacy Supabase Storage project to
 * their R2 equivalent. Order items / cart snapshots saved before the R2
 * migration store absolute Supabase URLs that no longer resolve (the legacy
 * project was deleted, so DNS returns NXDOMAIN). The files themselves were
 * copied to R2 under the same bucket/path, so the host swap is enough.
 */
export function normalizeR2Url(url: string): string {
  if (!url) return url;
  if (!LEGACY_SUPABASE_HOST_PATTERN.test(url)) return url;
  const withoutQuery = url.split('?')[0];
  const path = withoutQuery.replace(LEGACY_SUPABASE_HOST_PATTERN, '');
  return `${R2_PUBLIC_BASE}/${path}`;
}

/**
 * Maps an original R2 image URL to the pre-generated WebP variant URL.
 *
 * Example:
 *   getImageVariantUrl('https://pub-xxx.r2.dev/products/principal.jpg', 'card')
 *   → 'https://pub-xxx.r2.dev/products/principal-card.webp'
 *
 * Accepts legacy Supabase URLs and rewrites them to R2 first.
 * Falls back to originalUrl for:
 * - size === 'original'
 * - non-R2 URLs after normalization
 * - URLs without a file extension
 */
export function getImageVariantUrl(originalUrl: string, size: ImageVariantSize): string {
  if (!originalUrl) return originalUrl;
  const normalized = normalizeR2Url(originalUrl);
  if (size === 'original') return normalized;
  if (!R2_URL_PATTERN.test(normalized)) return normalized;

  const lastDotIdx = normalized.lastIndexOf('.');
  const lastSlashIdx = normalized.lastIndexOf('/');
  if (lastDotIdx <= lastSlashIdx) return normalized;

  const base = normalized.substring(0, lastDotIdx);
  return `${base}-${size}.webp`;
}

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'origin' | 'avif';
  resize?: 'cover' | 'contain' | 'fill';
}

interface ImageSize {
  width: number;
  height: number;
  label: string;
}

/** Inline SVG placeholder for missing product images (neutral gray box with image icon) */
export const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1200' viewBox='0 0 800 1200'%3E%3Crect fill='%23f5f5f5' width='800' height='1200'/%3E%3Cg transform='translate(350,550)'%3E%3Cpath d='M50 0L100 50V80H0V50L25 25L40 40L50 0z' fill='%23d4d4d4'/%3E%3Crect y='80' width='100' height='5' fill='%23d4d4d4'/%3E%3C/g%3E%3C/svg%3E";

const IMAGE_SIZES: Record<string, ImageSize> = {
  thumbnail: { width: 300, height: 400, label: '300w' },
  small: { width: 450, height: 600, label: '450w' },
  medium: { width: 600, height: 800, label: '600w' },
  large: { width: 900, height: 1200, label: '900w' },
  xlarge: { width: 1200, height: 1600, label: '1200w' },
};

const SUPABASE_STORAGE_URL_PATTERN = /supabase\.co\/storage\/v1\/(object|render\/image)\/public\//;
const SUPABASE_BUCKET_PATH_PATTERN = /supabase\.co\/storage\/v1\/(?:object|render\/image)\/public\/(.+)/;

// S3 + CloudFront CDN — fallback quando Supabase Storage falhar
// Espelha o mesmo path: {bucket}/{path}
const CDN_FALLBACK_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CDN_URL : '') || '';

export function isSupabaseStorageUrl(url: string): boolean {
  return SUPABASE_STORAGE_URL_PATTERN.test(url);
}

/**
 * Converte URL do Supabase Storage para URL do CDN de fallback (CloudFront/S3).
 * Remove query params (transforms do Supabase não funcionam no CDN).
 * Retorna '' se CDN não configurado ou URL não é do Supabase.
 */
export function getCDNFallbackUrl(supabaseUrl: string): string {
  if (!CDN_FALLBACK_URL) return '';
  const withoutParams = supabaseUrl.split('?')[0];
  const match = withoutParams.match(SUPABASE_BUCKET_PATH_PATTERN);
  if (!match) return '';
  return `${CDN_FALLBACK_URL}/${match[1]}`;
}

/**
 * @deprecated Use getCDNFallbackUrl. Kept for backwards compatibility.
 */
export function getR2FallbackUrl(_supabaseUrl: string): string {
  return '';
}

/**
 * Image onError handler — circuit breaker:
 * 1. Supabase falha → tenta CDN de fallback (S3/CloudFront)
 * 2. CDN falha → mostra placeholder
 *
 * Use: onError={(e) => handleImageError(e)}
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement, Event>): void {
  const img = event.currentTarget;

  // Já está no placeholder — para
  if (img.src === PLACEHOLDER_IMAGE || img.src.startsWith('data:')) return;

  // Primeira falha: tenta CDN se a URL era do Supabase
  if (isSupabaseStorageUrl(img.src) && !img.dataset.cdnFallbackTried) {
    const cdnUrl = getCDNFallbackUrl(img.src);
    if (cdnUrl) {
      img.dataset.cdnFallbackTried = '1';
      img.src = cdnUrl;
      return;
    }
  }

  // Fallback final: placeholder
  img.src = PLACEHOLDER_IMAGE;
}

function transformSupabaseUrl(url: string, options: ImageTransformOptions): string {
  if (!isSupabaseStorageUrl(url)) {
    return url;
  }

  // Supabase image transforms require the /render/image/ endpoint.
  // /object/public/ serves raw files and ignores all transform params.
  const renderUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const urlObj = new URL(renderUrl);
  const params = new URLSearchParams();

  if (options.width) {
    params.set('width', options.width.toString());
  }

  if (options.height) {
    params.set('height', options.height.toString());
  }

  if (options.quality) {
    params.set('quality', options.quality.toString());
  }

  if (options.format && options.format !== 'origin') {
    params.set('format', options.format);
  }

  if (options.resize) {
    params.set('resize', options.resize);
  }

  const queryString = params.toString();
  return queryString ? `${urlObj.origin}${urlObj.pathname}?${queryString}` : url;
}

export function getOptimizedImageUrl(
  url: string | undefined | null,
  size: keyof typeof IMAGE_SIZES = 'medium',
  options: Partial<ImageTransformOptions> = {}
): string {
  if (!url) {
    return PLACEHOLDER_IMAGE;
  }

  const sizeConfig = IMAGE_SIZES[size];

  return transformSupabaseUrl(url, {
    width: options.width ?? sizeConfig.width,
    height: options.height ?? sizeConfig.height,
    quality: options.quality ?? (size === 'thumbnail' ? 75 : 80),
    format: options.format ?? 'avif',
    resize: options.resize ?? 'cover',
  });
}

export function generateSrcSet(
  url: string | undefined | null,
  sizes: Array<keyof typeof IMAGE_SIZES> = ['thumbnail', 'small', 'medium', 'large'],
  baseQuality?: number
): string {
  if (!url) {
    return '';
  }

  // Don't generate srcSet for placeholder images
  if (url === PLACEHOLDER_IMAGE || url.startsWith('data:')) {
    return '';
  }

  // For R2 URLs use pre-generated WebP variants (thumb/grid/card)
  if (R2_URL_PATTERN.test(url)) {
    return [
      `${getImageVariantUrl(url, 'thumb')} 300w`,
      `${getImageVariantUrl(url, 'grid')} 450w`,
      `${getImageVariantUrl(url, 'card')} 600w`,
    ].join(', ');
  }

  if (!isSupabaseStorageUrl(url)) {
    return '';
  }

  const qualityMap: Record<string, number> = {
    thumbnail: baseQuality ? Math.max(70, baseQuality - 10) : 70,
    small: baseQuality ? Math.max(75, baseQuality - 5) : 75,
    medium: baseQuality || 80,
    large: baseQuality ? Math.min(90, baseQuality + 5) : 85,
    xlarge: baseQuality ? Math.min(95, baseQuality + 10) : 90,
  };

  return sizes
    .map((size) => {
      const config = IMAGE_SIZES[size];
      const quality = qualityMap[size] || 80;
      const optimizedUrl = getOptimizedImageUrl(url, size, { quality });
      return `${optimizedUrl} ${config.label}`;
    })
    .join(', ');
}

// Pre-computed sizes string for product cards in the grid (2-col mobile, 3-col tablet, 4-col desktop)
// Exported as constant — no rebuilding on every render
export const CARD_SIZES = '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';

export function generateSizes(breakpoints: Record<string, string> = {}): string {
  if (Object.keys(breakpoints).length === 0) return CARD_SIZES;

  const defaultBreakpoints: Record<string, string> = {
    '(max-width: 768px)': '50vw',
    '(max-width: 1024px)': '33vw',
    default: '25vw',
  };

  const merged = { ...defaultBreakpoints, ...breakpoints };
  const entries = Object.entries(merged);

  return entries
    .map(([breakpoint, size]) => {
      if (breakpoint === 'default') {
        return size;
      }
      return `${breakpoint} ${size}`;
    })
    .join(', ');
}

export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage));
}

export function getPlaceholderUrl(width: number = 300, height: number = 400): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect fill='%23f5f5f5' width='100%25' height='100%25'/%3E%3C/svg%3E`;
}

export { IMAGE_SIZES };
export type { ImageTransformOptions, ImageSize };
