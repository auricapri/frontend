import { useCallback, useRef } from 'react';
import { cacheService, CacheConfigs } from '../services/cache.service';
import { cachedApiClient } from '../api/cached-client';
import { preloadImage, getOptimizedImageUrl } from '../utils/image';
import { Product } from '../types';

interface PrefetchOptions {
  delay?: number;
  onlyOnHover?: boolean;
}

export function usePrefetch() {
  const prefetchedUrls = useRef<Set<string>>(new Set());
  const prefetchedProducts = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefetchImage = useCallback(async (url: string | undefined | null) => {
    if (!url || prefetchedUrls.current.has(url)) {
      return;
    }

    try {
      const optimizedUrl = getOptimizedImageUrl(url, 'medium');
      await preloadImage(optimizedUrl);
      prefetchedUrls.current.add(url);
    } catch (_e) {
      return;
    }
  }, []);

  const prefetchImages = useCallback(async (urls: (string | undefined | null)[]) => {
    const validUrls = urls.filter((url): url is string => !!url && !prefetchedUrls.current.has(url));

    await Promise.allSettled(
      validUrls.map(async (url) => {
        try {
          const optimizedUrl = getOptimizedImageUrl(url, 'medium');
          await preloadImage(optimizedUrl);
          prefetchedUrls.current.add(url);
        } catch (_e) {
          return;
        }
      })
    );
  }, []);

  const prefetchProduct = useCallback(async (productId: string) => {
    if (prefetchedProducts.current.has(productId)) {
      return;
    }

    try {
      await cachedApiClient.get<Product>(`/products/${productId}`, {
        cacheConfig: CacheConfigs.PRODUCT_DETAIL,
        cacheKey: `api:products:id:${productId}`,
      });
      prefetchedProducts.current.add(productId);
    } catch (_e) {
      return;
    }
  }, []);

  const prefetchProductBySlug = useCallback(async (slug: string) => {
    const cacheKey = `api:products:slug:${slug}`;
    const cached = await cacheService.get<Product>(cacheKey);

    if (cached) {
      return;
    }

    try {
      await cachedApiClient.get<Product>(`/products/slug/${slug}`, {
        cacheConfig: CacheConfigs.PRODUCT_DETAIL,
        cacheKey,
      });
    } catch (_e) {
      return;
    }
  }, []);

  const prefetchOnHover = useCallback(
    (callback: () => Promise<void>, options: PrefetchOptions = {}) => {
      const { delay = 100 } = options;

      return {
        onMouseEnter: () => {
          timeoutRef.current = setTimeout(() => {
            callback();
          }, delay);
        },
        onMouseLeave: () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        },
      };
    },
    []
  );

  const prefetchProductOnHover = useCallback(
    (product: Product, options: PrefetchOptions = {}) => {
      return prefetchOnHover(async () => {
        await Promise.all([
          prefetchProduct(product.id),
          prefetchImage(product.default_image_url),
          prefetchImages(product.base_images || []),
        ]);
      }, options);
    },
    [prefetchOnHover, prefetchProduct, prefetchImage, prefetchImages]
  );

  const prefetchVisibleImages = useCallback(
    (images: (string | undefined | null)[], startIndex: number, count: number = 3) => {
      const endIndex = Math.min(startIndex + count, images.length);
      const toPreload = images.slice(startIndex, endIndex);
      prefetchImages(toPreload);
    },
    [prefetchImages]
  );

  const clearPrefetchCache = useCallback(() => {
    prefetchedUrls.current.clear();
    prefetchedProducts.current.clear();
  }, []);

  return {
    prefetchImage,
    prefetchImages,
    prefetchProduct,
    prefetchProductBySlug,
    prefetchOnHover,
    prefetchProductOnHover,
    prefetchVisibleImages,
    clearPrefetchCache,
  };
}

export default usePrefetch;
