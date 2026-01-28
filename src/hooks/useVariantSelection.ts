/**
 * useVariantSelection Hook
 * Manages product variant selection state (size, color)
 * Handles auto-selection and validation of variant combinations
 */

import { useState, useMemo, useEffect } from 'react';
import type { ProductVariant, UserMode, LocalizedText } from '../types';
import { getProductColors, getProductSizes, findActiveVariant, filterVariantsForMode, type ColorOption } from '../utils/variant';

export interface UseVariantSelectionProps {
  /** Product variants array */
  variants: ProductVariant[] | undefined;
  /** User mode (VAREJO or ATACADO) */
  userMode: UserMode;
  /** Minimum stock required for atacado mode (default: 10) */
  atacadoMinStock?: number;
}

export interface UseVariantSelectionReturn {
  /** Available color options */
  colors: ColorOption[];
  /** Available sizes for selected color */
  sizes: string[];
  /** Currently selected size */
  selectedSize: string;
  /** Currently selected color hex */
  selectedColorHex: string;
  /** Active variant based on selection */
  activeVariant: ProductVariant | undefined;
  /** Set selected size */
  setSelectedSize: (size: string) => void;
  /** Set selected color hex */
  setSelectedColorHex: (hex: string) => void;
  /** Whether selected size is available for selected color */
  isSelectedSizeAvailable: boolean;
  /** Filtered variants based on user mode */
  filteredVariants: ProductVariant[];
}

/**
 * Hook for managing product variant selection
 *
 * @param props - Configuration options
 * @returns Variant selection state and handlers
 *
 * @example
 * const {
 *   colors,
 *   sizes,
 *   selectedSize,
 *   selectedColorHex,
 *   activeVariant,
 *   setSelectedSize,
 *   setSelectedColorHex,
 * } = useVariantSelection({
 *   variants: product.variants,
 *   userMode: UserMode.VAREJO,
 * });
 */
export function useVariantSelection({
  variants,
  userMode,
  atacadoMinStock = 10,
}: UseVariantSelectionProps): UseVariantSelectionReturn {
  // State
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColorHex, setSelectedColorHex] = useState<string>('');

  // Filter variants for atacado mode (higher stock requirement)
  const filteredVariants = useMemo(() => {
    const allVariants = variants || [];
    if (userMode === 'ATACADO') {
      return allVariants.filter(v => v.stock_quantity >= atacadoMinStock);
    }
    return allVariants;
  }, [variants, userMode, atacadoMinStock]);

  // Get unique colors from filtered variants
  const colors = useMemo(() => {
    return getProductColors(filteredVariants);
  }, [filteredVariants]);

  // Get sizes filtered by selected color
  const sizes = useMemo(() => {
    if (!selectedColorHex) {
      // If no color selected, show all sizes
      return getProductSizes(filteredVariants);
    }
    // Filter by selected color
    return getProductSizes(filteredVariants, selectedColorHex);
  }, [filteredVariants, selectedColorHex]);

  // Check if selected size is available for selected color
  const isSelectedSizeAvailable = useMemo(() => {
    if (!selectedSize || !selectedColorHex) return true;
    return filteredVariants.some(
      v => v.size === selectedSize && v.color_hex === selectedColorHex
    );
  }, [filteredVariants, selectedSize, selectedColorHex]);

  // Find active variant based on selection
  const activeVariant = useMemo(() => {
    const found = findActiveVariant(filteredVariants, selectedSize, selectedColorHex);
    return found || filteredVariants[0];
  }, [selectedSize, selectedColorHex, filteredVariants]);

  // Auto-select first color when variants are loaded
  useEffect(() => {
    if (colors.length > 0 && !selectedColorHex) {
      setSelectedColorHex(colors[0].hex);
    }
  }, [colors, selectedColorHex]);

  // Auto-select first size when color is selected
  useEffect(() => {
    if (selectedColorHex && sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
  }, [selectedColorHex, sizes, selectedSize]);

  // Update size when color changes (if current size is unavailable)
  useEffect(() => {
    if (sizes.length > 0) {
      if (!isSelectedSizeAvailable) {
        // Reset to first available size for new color
        setSelectedSize(sizes[0] || '');
      } else if (!selectedSize) {
        // Select first if none selected
        setSelectedSize(sizes[0] || '');
      }
    }
  }, [sizes, selectedColorHex, isSelectedSizeAvailable, selectedSize]);

  return {
    colors,
    sizes,
    selectedSize,
    selectedColorHex,
    activeVariant,
    setSelectedSize,
    setSelectedColorHex,
    isSelectedSizeAvailable,
    filteredVariants,
  };
}
