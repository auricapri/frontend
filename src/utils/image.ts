interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'origin' | 'webp';
  resize?: 'cover' | 'contain' | 'fill';
}

interface ImageSize {
  width: number;
  height: number;
  label: string;
}

const IMAGE_SIZES: Record<string, ImageSize> = {
  thumbnail: { width: 300, height: 400, label: '300w' },
  small: { width: 450, height: 600, label: '450w' },
  medium: { width: 600, height: 800, label: '600w' },
  large: { width: 900, height: 1200, label: '900w' },
  xlarge: { width: 1200, height: 1600, label: '1200w' },
};

const SUPABASE_STORAGE_URL_PATTERN = /supabase\.co\/storage\/v1\/object\/public\//;

function isSupabaseStorageUrl(url: string): boolean {
  return SUPABASE_STORAGE_URL_PATTERN.test(url);
}

function transformSupabaseUrl(url: string, options: ImageTransformOptions): string {
  if (!isSupabaseStorageUrl(url)) {
    return url;
  }

  const urlObj = new URL(url);
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
    return '';
  }

  const sizeConfig = IMAGE_SIZES[size];

  return transformSupabaseUrl(url, {
    width: options.width ?? sizeConfig.width,
    height: options.height ?? sizeConfig.height,
    quality: options.quality ?? (size === 'thumbnail' ? 75 : 80),
    format: options.format ?? 'webp',
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

  if (!isSupabaseStorageUrl(url)) {
    return url;
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

export function generateSizes(breakpoints: Record<string, string> = {}): string {
  const defaultBreakpoints = {
    '(max-width: 640px)': '100vw',
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

export { IMAGE_SIZES, isSupabaseStorageUrl };
export type { ImageTransformOptions, ImageSize };

