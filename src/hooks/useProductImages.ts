/**
 * useProductImages Hook
 * Builds and manages product image gallery with variant mapping
 * Handles deduplication, sorting, and variant-to-image associations
 */

import { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import type { Product, ProductVariant, LocalizedText } from '../types';

/**
 * Image data with variant association
 */
export interface ImageData {
  /** Image URL */
  url: string;
  /** Primary variant ID associated with this image */
  variantId: string;
  /** All variant IDs that use this image */
  variantIds: string[];
  /** Color hex of primary variant */
  variantColor: string;
  /** Localized color name */
  variantColorName: LocalizedText | null;
  /** Size of primary variant */
  size: string;
  /** Combination key (size-color) for grouping */
  combinationKey: string;
  /** Whether this is a base product image */
  isBase: boolean;
}

export interface UseProductImagesProps {
  /** Product to get images from */
  product: Product;
  /** Product variants (can be filtered) */
  variants: ProductVariant[] | undefined;
  /** Active variant ID for scrolling */
  activeVariantId?: string;
  /** Placeholder image URL if no images found */
  placeholderUrl?: string;
}

export interface UseProductImagesReturn {
  /** All images with variant data */
  images: ImageData[];
  /** Just URLs for display (backward compatibility) */
  displayImages: string[];
  /** Map of variant ID to first image index */
  variantToImageIndex: Map<string, number>;
  /** Scroll gallery to show variant's images */
  scrollToVariant: (variantId: string) => void;
  /** Ref for mobile gallery container */
  mobileGalleryRef: React.RefObject<HTMLDivElement | null>;
  /** Current mobile gallery index */
  mobileActiveIdx: number;
  /** Set mobile gallery index */
  setMobileActiveIdx: (idx: number) => void;
}

const DEFAULT_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1200' viewBox='0 0 800 1200'%3E%3Crect fill='%23f5f5f5' width='800' height='1200'/%3E%3Cg transform='translate(350,550)'%3E%3Cpath d='M50 0L100 50V80H0V50L25 25L40 40L50 0z' fill='%23d4d4d4'/%3E%3Crect y='80' width='100' height='5' fill='%23d4d4d4'/%3E%3C/g%3E%3C/svg%3E";

/**
 * Hook for building and managing product image gallery
 *
 * @param props - Configuration options
 * @returns Image gallery data and handlers
 *
 * @example
 * const {
 *   images,
 *   displayImages,
 *   scrollToVariant,
 *   mobileGalleryRef,
 * } = useProductImages({
 *   product,
 *   variants: filteredVariants,
 *   activeVariantId: activeVariant?.id,
 * });
 */
export function useProductImages({
  product,
  variants,
  activeVariantId,
  placeholderUrl = DEFAULT_PLACEHOLDER,
}: UseProductImagesProps): UseProductImagesReturn {
  const mobileGalleryRef = useRef<HTMLDivElement>(null);
  const [mobileActiveIdx, setMobileActiveIdx] = useState(0);

  // Build gallery without duplicates by URL
  const images = useMemo(() => {
    const result: ImageData[] = [];
    const urlToIndex = new Map<string, number>();

    // First, add base images
    const baseImgs = product.base_images || [];
    for (const img of baseImgs) {
      if (img && typeof img === 'string' && img.trim() !== '') {
        const trimmedUrl = img.trim();
        if (!urlToIndex.has(trimmedUrl)) {
          const index = result.length;
          result.push({
            url: trimmedUrl,
            variantId: 'base',
            variantColor: '',
            variantColorName: null,
            size: '',
            combinationKey: 'base',
            isBase: true,
            variantIds: ['base'],
          });
          urlToIndex.set(trimmedUrl, index);
        } else {
          // Image already exists, add 'base' to variantIds
          const existingIndex = urlToIndex.get(trimmedUrl)!;
          if (!result[existingIndex].variantIds.includes('base')) {
            result[existingIndex].variantIds.push('base');
          }
        }
      }
    }

    // Then, process variant images
    const allVariants = variants || [];
    for (const variant of allVariants) {
      const variantImages = variant.variant_images || [];
      if (!Array.isArray(variantImages) || variantImages.length === 0) continue;

      const size = variant.size || '';
      const colorHex = variant.color_hex || '';
      const combinationKey = `${size}-${colorHex}`;

      for (const img of variantImages) {
        if (!img || typeof img !== 'string' || img.trim() === '') continue;

        const trimmedUrl = img.trim();

        if (urlToIndex.has(trimmedUrl)) {
          // Image already exists, track this variant
          const existingIndex = urlToIndex.get(trimmedUrl)!;
          if (!result[existingIndex].variantIds.includes(variant.id)) {
            result[existingIndex].variantIds.push(variant.id);
          }
          // Update to first variant that uses this image (for backwards compatibility)
          if (result[existingIndex].variantId === 'base') {
            result[existingIndex].variantId = variant.id;
            result[existingIndex].variantColor = colorHex;
            result[existingIndex].variantColorName = variant.color_name;
            result[existingIndex].size = size;
            result[existingIndex].combinationKey = combinationKey;
            result[existingIndex].isBase = false;
          }
        } else {
          // New image, add to gallery
          const index = result.length;
          result.push({
            url: trimmedUrl,
            variantId: variant.id,
            variantColor: colorHex,
            variantColorName: variant.color_name,
            size: size,
            combinationKey: combinationKey,
            isBase: false,
            variantIds: [variant.id],
          });
          urlToIndex.set(trimmedUrl, index);
        }
      }
    }

    // Sort: base images first, then by combination key
    result.sort((a, b) => {
      if (a.isBase && !b.isBase) return -1;
      if (!a.isBase && b.isBase) return 1;
      if (a.isBase && b.isBase) return 0;
      return a.combinationKey.localeCompare(b.combinationKey);
    });

    // Add placeholder if no images
    if (result.length === 0) {
      result.push({
        url: placeholderUrl,
        variantId: 'base',
        variantColor: '',
        variantColorName: null,
        size: '',
        combinationKey: 'base',
        isBase: true,
        variantIds: ['base'],
      });
    }

    return result;
  }, [variants, product.base_images, placeholderUrl]);

  // Map variant ID to first image index
  const variantToImageIndex = useMemo(() => {
    const map = new Map<string, number>();
    images.forEach((img, index) => {
      for (const variantId of img.variantIds) {
        if (!map.has(variantId)) {
          map.set(variantId, index);
        }
      }
    });
    return map;
  }, [images]);

  // Extract just URLs for display
  const displayImages = useMemo(() => images.map(img => img.url), [images]);

  // Scroll to variant's images
  const scrollToVariant = useCallback(
    (variantId: string) => {
      const targetIndex = variantToImageIndex.get(variantId);
      const finalIndex = targetIndex !== undefined && targetIndex >= 0 ? targetIndex : 0;

      // Desktop: scroll vertical gallery
      const desktopGallery = document.getElementById('desktop-gallery');
      if (desktopGallery && finalIndex < desktopGallery.children.length) {
        const targetCard = desktopGallery.children[finalIndex] as HTMLElement;
        targetCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Mobile: scroll horizontal gallery
      if (mobileGalleryRef.current && finalIndex < images.length) {
        const galleryWidth = mobileGalleryRef.current.offsetWidth;
        if (galleryWidth > 0) {
          mobileGalleryRef.current.scrollTo({
            left: finalIndex * galleryWidth,
            behavior: 'smooth',
          });
          setMobileActiveIdx(finalIndex);
        }
      }
    },
    [variantToImageIndex, images.length]
  );

  // Auto-scroll when active variant changes
  useEffect(() => {
    if (activeVariantId) {
      // Small delay for DOM to be ready
      const timeout = setTimeout(() => {
        scrollToVariant(activeVariantId);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [activeVariantId, scrollToVariant]);

  return {
    images,
    displayImages,
    variantToImageIndex,
    scrollToVariant,
    mobileGalleryRef,
    mobileActiveIdx,
    setMobileActiveIdx,
  };
}
