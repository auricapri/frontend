import { Product, UserMode } from '../types';
import { calculatePrice } from './product';
import { Locale } from '../i18n';

export interface PriceRange {
  min: number;
  max: number;
  label: string;
  id: string;
}

export type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'popularity';

const SIZE_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', 'XXXG'];

function compareSizes(a: string, b: string): number {
  const aIndex = SIZE_ORDER.indexOf(a.toUpperCase());
  const bIndex = SIZE_ORDER.indexOf(b.toUpperCase());
  
  if (aIndex !== -1 && bIndex !== -1) {
    return aIndex - bIndex;
  }
  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;
  return a.localeCompare(b);
}

export function getAvailableSizes(products: Product[]): string[] {
  const sizesSet = new Set<string>();
  
  products.forEach(product => {
    product.variants?.forEach(variant => {
      if (variant.size && variant.size.trim() !== '') {
        sizesSet.add(variant.size.trim());
      }
    });
  });
  
  return Array.from(sizesSet).sort(compareSizes);
}

export function getSizeCounts(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  products.forEach(product => {
    const productSizes = new Set<string>();
    product.variants?.forEach(variant => {
      if (variant.size && variant.size.trim() !== '') {
        productSizes.add(variant.size.trim());
      }
    });
    
    productSizes.forEach(size => {
      counts[size] = (counts[size] || 0) + 1;
    });
  });
  
  return counts;
}

function roundToNearest(value: number, roundTo: number): number {
  return Math.round(value / roundTo) * roundTo;
}

export function calculateDynamicPriceRanges(
  products: Product[],
  userMode: UserMode
): PriceRange[] {
  if (products.length === 0) return [];
  
  const prices: number[] = [];
  
  products.forEach(product => {
    product.variants?.forEach(variant => {
      const price = calculatePrice(variant, userMode, product);
      if (price > 0) {
        prices.push(price);
      }
    });
  });
  
  if (prices.length === 0) return [];
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  if (minPrice === maxPrice) {
    const rounded = roundToNearest(minPrice, 10);
    return [{
      min: rounded,
      max: rounded,
      label: `${rounded}`,
      id: `${rounded}`
    }];
  }
  
  const range = maxPrice - minPrice;
  const numRanges = Math.min(5, Math.max(3, Math.ceil(range / 50)));
  const step = range / numRanges;
  
  const ranges: PriceRange[] = [];
  
  for (let i = 0; i < numRanges; i++) {
    const rangeMin = i === 0 ? minPrice : minPrice + (step * i);
    const rangeMax = i === numRanges - 1 ? maxPrice : minPrice + (step * (i + 1));
    
    const roundedMin = i === 0 ? Math.floor(rangeMin / 10) * 10 : roundToNearest(rangeMin, 10);
    const roundedMax = i === numRanges - 1 ? Math.ceil(rangeMax / 10) * 10 : roundToNearest(rangeMax, 10);
    
    const rangeId = `${roundedMin}-${roundedMax}`;
    const hasProducts = prices.some(p => p >= roundedMin && p <= roundedMax);
    
    if (hasProducts) {
      ranges.push({
        min: roundedMin,
        max: roundedMax,
        label: roundedMin === roundedMax 
          ? `${roundedMin}` 
          : `${roundedMin} - ${roundedMax}`,
        id: rangeId
      });
    }
  }
  
  return ranges;
}

export function getPriceRangeCounts(
  products: Product[],
  ranges: PriceRange[],
  userMode: UserMode
): Record<string, number> {
  const counts: Record<string, number> = {};
  
  ranges.forEach(range => {
    let count = 0;
    
    products.forEach(product => {
      const hasVariantInRange = product.variants?.some(variant => {
        const price = calculatePrice(variant, userMode, product);
        return price >= range.min && price <= range.max;
      });
      
      if (hasVariantInRange) {
        count++;
      }
    });
    
    counts[range.id] = count;
  });
  
  return counts;
}

export function filterProductsBySize(
  products: Product[],
  sizes: string[]
): Product[] {
  if (sizes.length === 0) return products;
  
  return products.filter(product => {
    return product.variants?.some(variant => {
      if (!variant.size) return false;
      return sizes.includes(variant.size.trim());
    });
  });
}

export function filterProductsByPriceRange(
  products: Product[],
  ranges: PriceRange[],
  userMode: UserMode
): Product[] {
  if (ranges.length === 0) return products;
  
  return products.filter(product => {
    return product.variants?.some(variant => {
      const price = calculatePrice(variant, userMode, product);
      return ranges.some(range => price >= range.min && price <= range.max);
    });
  });
}

export function filterProductsByPriceMinMax(
  products: Product[],
  minPrice: number | null,
  maxPrice: number | null,
  userMode: UserMode
): Product[] {
  if (minPrice === null && maxPrice === null) return products;
  
  return products.filter(product => {
    return product.variants?.some(variant => {
      const price = calculatePrice(variant, userMode, product);
      if (minPrice !== null && price < minPrice) return false;
      if (maxPrice !== null && price > maxPrice) return false;
      return true;
    });
  });
}

export function getPriceMinMax(
  products: Product[],
  userMode: UserMode
): { min: number; max: number } {
  if (products.length === 0) return { min: 0, max: 0 };
  
  const prices: number[] = [];
  
  products.forEach(product => {
    product.variants?.forEach(variant => {
      const price = calculatePrice(variant, userMode, product);
      if (price > 0) {
        prices.push(price);
      }
    });
  });
  
  if (prices.length === 0) return { min: 0, max: 0 };
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  return {
    min: Math.floor(min / 10) * 10,
    max: Math.ceil(max / 10) * 10
  };
}

export function sortProducts(
  products: Product[],
  sortBy: SortOption,
  userMode: UserMode
): Product[] {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'relevance': {
      return sorted.sort((a, b) => {
        if (a.is_highlight && !b.is_highlight) return -1;
        if (!a.is_highlight && b.is_highlight) return 1;
        return 0;
      });
    }
    
    case 'price-asc': {
      return sorted.sort((a, b) => {
        const aPrice = getMinProductPrice(a, userMode);
        const bPrice = getMinProductPrice(b, userMode);
        return aPrice - bPrice;
      });
    }
    
    case 'price-desc': {
      return sorted.sort((a, b) => {
        const aPrice = getMinProductPrice(a, userMode);
        const bPrice = getMinProductPrice(b, userMode);
        return bPrice - aPrice;
      });
    }
    
    case 'popularity': {
      return sorted.sort((a, b) => {
        const aReviews = a.total_reviews || 0;
        const bReviews = b.total_reviews || 0;
        return bReviews - aReviews;
      });
    }
    
    default:
      return sorted;
  }
}

function getMinProductPrice(product: Product, userMode: UserMode): number {
  if (!product.variants || product.variants.length === 0) return Infinity;

  const prices = product.variants
    .map(variant => calculatePrice(variant, userMode, product))
    .filter(price => price > 0);

  return prices.length > 0 ? Math.min(...prices) : Infinity;
}

export function searchProducts(
  query: string,
  products: Product[],
  locale: Locale = 'pt'
): Product[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return products;

  return products.filter(product => {
    const getLoc = (obj: any): string => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj.toLowerCase();
      if (typeof obj === 'object') {
        return (obj[locale] || obj['pt'] || obj['en'] || '').toLowerCase();
      }
      return String(obj).toLowerCase();
    };

    // Search in product name
    if (getLoc(product.name).includes(normalizedQuery)) return true;
    // Search in description
    if (getLoc(product.description).includes(normalizedQuery)) return true;
    // Search in category
    if (product.category && getLoc(product.category.name).includes(normalizedQuery)) return true;

    return false;
  });
}
