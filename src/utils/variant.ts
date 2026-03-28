/**
 * Variant Utilities
 * Shared functions for product variant extraction and filtering
 * Used by ProductDetail, ProductGrid, and related components
 */

import type { ProductVariant, Product, LocalizedText, UserMode } from '../types';

/**
 * Color option extracted from variants
 */
export interface ColorOption {
  /** Hex color code (e.g., "#FF0000") */
  hex: string;
  /** Localized color name */
  name: LocalizedText;
  /** First variant image for this color (use as swatch background when it's a pattern/print) */
  image?: string;
}

/**
 * Size option with availability status
 */
export interface SizeOption {
  /** Size value (e.g., "P", "M", "G", "38") */
  size: string;
  /** Whether this size is available for purchase */
  available: boolean;
}

/**
 * Extracts unique color options from product variants
 * Deduplicates by hex code, keeping the first occurrence's name
 *
 * @param variants - Array of product variants
 * @returns Array of unique color options
 *
 * @example
 * const colors = getProductColors(product.variants);
 * // Returns: [{ hex: "#000000", name: { pt: "Preto", en: "Black" } }, ...]
 */
export function getProductColors(variants: ProductVariant[] | undefined): ColorOption[] {
  if (!variants?.length) return [];

  const colorMap = new Map<string, { name: LocalizedText; image?: string }>();

  for (const variant of variants) {
    if (variant.color_hex && !colorMap.has(variant.color_hex)) {
      colorMap.set(variant.color_hex, {
        name: variant.color_name,
        image: variant.variant_images?.[0],
      });
    }
  }

  return Array.from(colorMap.entries()).map(([hex, { name, image }]) => ({ hex, name, image }));
}

/**
 * Extracts unique size values from product variants
 * Optionally filters by a specific color
 *
 * @param variants - Array of product variants
 * @param colorHex - Optional color hex to filter by
 * @returns Array of unique size strings
 *
 * @example
 * const sizes = getProductSizes(product.variants, "#000000");
 * // Returns: ["P", "M", "G", "GG"]
 */
export function getProductSizes(
  variants: ProductVariant[] | undefined,
  colorHex?: string
): string[] {
  if (!variants?.length) return [];

  const sizes = new Set<string>();

  for (const variant of variants) {
    if (variant.size) {
      // If colorHex is specified, only include sizes for that color
      if (!colorHex || variant.color_hex === colorHex) {
        sizes.add(variant.size);
      }
    }
  }

  return Array.from(sizes);
}

/**
 * Gets sizes with availability status for a specific color
 *
 * @param variants - Array of product variants
 * @param colorHex - Color hex to filter by
 * @param minStock - Minimum stock to consider available (default: 1)
 * @returns Array of size options with availability
 */
export function getSizesWithAvailability(
  variants: ProductVariant[] | undefined,
  colorHex: string,
  minStock = 1
): SizeOption[] {
  if (!variants?.length) return [];

  const sizeMap = new Map<string, boolean>();

  for (const variant of variants) {
    if (variant.size && variant.color_hex === colorHex) {
      const isAvailable = variant.is_active && variant.stock_quantity >= minStock;
      // Only mark as available if any variant of this size is available
      if (sizeMap.has(variant.size)) {
        sizeMap.set(variant.size, sizeMap.get(variant.size)! || isAvailable);
      } else {
        sizeMap.set(variant.size, isAvailable);
      }
    }
  }

  return Array.from(sizeMap.entries()).map(([size, available]) => ({
    size,
    available,
  }));
}

/**
 * Filters variants based on user mode (retail/wholesale)
 * Returns only variants that have stock and are active
 *
 * @param variants - Array of product variants
 * @param mode - User mode (VAREJO or ATACADO)
 * @param requireStock - Whether to require stock > 0 (default: true)
 * @returns Filtered array of variants
 */
export function filterVariantsForMode(
  variants: ProductVariant[] | undefined,
  mode: UserMode,
  requireStock = true
): ProductVariant[] {
  if (!variants?.length) return [];

  return variants.filter(variant => {
    // Must be active
    if (!variant.is_active) return false;

    // Check stock if required
    if (requireStock && variant.stock_quantity <= 0) return false;

    // Check price is set for the mode
    const price = mode === 'ATACADO' ? variant.wholesale_price : variant.retail_price;
    if (!price || price <= 0) return false;

    return true;
  });
}

/**
 * Finds a specific variant by size and color
 *
 * @param variants - Array of product variants
 * @param size - Size to match
 * @param colorHex - Color hex to match
 * @returns Matching variant or undefined
 */
export function findActiveVariant(
  variants: ProductVariant[] | undefined,
  size: string,
  colorHex: string
): ProductVariant | undefined {
  if (!variants?.length) return undefined;

  // Treat null/undefined and '' as equivalent so products without a
  // color_hex (single-color items) still match when selectedColorHex is ''.
  const targetHex = colorHex || '';
  return variants.find(
    v => v.size === size && (v.color_hex || '') === targetHex && v.is_active
  );
}

/**
 * Finds a variant by ID
 *
 * @param variants - Array of product variants
 * @param variantId - Variant ID to find
 * @returns Matching variant or undefined
 */
export function findVariantById(
  variants: ProductVariant[] | undefined,
  variantId: string
): ProductVariant | undefined {
  if (!variants?.length) return undefined;
  return variants.find(v => v.id === variantId);
}

/**
 * Gets the price for a variant based on user mode
 *
 * @param variant - The variant to get price for
 * @param mode - User mode (VAREJO or ATACADO)
 * @returns The appropriate price
 */
export function getVariantPrice(variant: ProductVariant, mode: UserMode): number {
  return mode === 'ATACADO' ? variant.wholesale_price : variant.retail_price;
}

/**
 * Checks if a variant is available for purchase
 *
 * @param variant - The variant to check
 * @param minStock - Minimum stock required (default: 1)
 * @returns Whether the variant is available
 */
export function isVariantAvailable(variant: ProductVariant, minStock = 1): boolean {
  return variant.is_active && variant.stock_quantity >= minStock;
}

/**
 * Gets the total stock count for a product across all variants
 *
 * @param variants - Array of product variants
 * @returns Total stock quantity
 */
export function getTotalStock(variants: ProductVariant[] | undefined): number {
  if (!variants?.length) return 0;
  return variants.reduce((sum, v) => sum + (v.is_active ? v.stock_quantity : 0), 0);
}

/**
 * Gets the first available variant from a product
 * Useful for default selection
 *
 * @param variants - Array of product variants
 * @param mode - User mode for price validation
 * @returns First available variant or undefined
 */
export function getFirstAvailableVariant(
  variants: ProductVariant[] | undefined,
  mode: UserMode
): ProductVariant | undefined {
  const available = filterVariantsForMode(variants, mode, true);
  return available[0];
}

/**
 * Extracts all unique variant images from a product's variants
 *
 * @param variants - Array of product variants
 * @returns Array of unique image URLs
 */
export function getAllVariantImages(variants: ProductVariant[] | undefined): string[] {
  if (!variants?.length) return [];

  const images = new Set<string>();

  for (const variant of variants) {
    for (const img of variant.variant_images || []) {
      images.add(img);
    }
  }

  return Array.from(images);
}

/**
 * Groups variants by color hex
 *
 * @param variants - Array of product variants
 * @returns Map of color hex to variants
 */
export function groupVariantsByColor(
  variants: ProductVariant[] | undefined
): Map<string, ProductVariant[]> {
  const groups = new Map<string, ProductVariant[]>();

  if (!variants?.length) return groups;

  for (const variant of variants) {
    const colorKey = variant.color_hex || 'default';
    const existing = groups.get(colorKey) || [];
    existing.push(variant);
    groups.set(colorKey, existing);
  }

  return groups;
}
