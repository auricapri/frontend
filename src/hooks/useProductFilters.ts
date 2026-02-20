import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Product, UserMode } from '../types';
import {
  getAvailableSizes,
  getSizeCounts,
  filterProductsBySize,
  filterProductsByPriceMinMax,
  getPriceMinMax,
  sortProducts,
  SortOption
} from '../utils/productFilters';
import { getProductColors, type ColorOption } from '../utils/variant';
import { useDebounce } from './useDebounce';

interface UseProductFiltersParams {
  products: Product[];
  activeCategory: string;
  userMode: UserMode;
}

interface UseProductFiltersReturn {
  selectedSizes: string[];
  selectedColors: string[];
  priceMin: number | null;
  priceMax: number | null;
  sortBy: SortOption;
  availableSizes: string[];
  availableColors: ColorOption[];
  priceBounds: { min: number; max: number };
  sizeCounts: Record<string, number>;
  filteredAndSortedProducts: Product[];
  toggleSize: (size: string) => void;
  toggleColor: (hex: string) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setSortBy: (sort: SortOption) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

function parseUrlParams(): {
  sizes: string[];
  priceMin: number | null;
  priceMax: number | null;
  sort: SortOption;
} {
  if (typeof window === 'undefined') {
    return { sizes: [], priceMin: null, priceMax: null, sort: 'relevance' };
  }
  
  const params = new URLSearchParams(window.location.search);
  const sizes = params.get('sizes')?.split(',').filter(Boolean) || [];
  const priceMinParam = params.get('priceMin');
  const priceMaxParam = params.get('priceMax');
  const priceMin = priceMinParam ? parseFloat(priceMinParam) : null;
  const priceMax = priceMaxParam ? parseFloat(priceMaxParam) : null;
  const sort = (params.get('sort') as SortOption) || 'relevance';
  
  return { sizes, priceMin, priceMax, sort };
}

function updateUrlParams(
  sizes: string[],
  priceMin: number | null,
  priceMax: number | null,
  sort: SortOption
): void {
  if (typeof window === 'undefined') return;
  
  const params = new URLSearchParams(window.location.search);
  
  if (sizes.length > 0) {
    params.set('sizes', sizes.join(','));
  } else {
    params.delete('sizes');
  }
  
  if (priceMin !== null) {
    params.set('priceMin', priceMin.toString());
  } else {
    params.delete('priceMin');
  }
  
  if (priceMax !== null) {
    params.set('priceMax', priceMax.toString());
  } else {
    params.delete('priceMax');
  }
  
  if (sort !== 'relevance') {
    params.set('sort', sort);
  } else {
    params.delete('sort');
  }
  
  const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  window.history.pushState({}, '', newUrl);
}

export function useProductFilters({
  products,
  activeCategory,
  userMode
}: UseProductFiltersParams): UseProductFiltersReturn {
  const urlParams = parseUrlParams();

  const [selectedSizes, setSelectedSizes] = useState<string[]>(urlParams.sizes);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number | null>(urlParams.priceMin);
  const [priceMax, setPriceMax] = useState<number | null>(urlParams.priceMax);
  const [sortBy, setSortByState] = useState<SortOption>(urlParams.sort);

  // Ref para evitar sync de URL no mount inicial
  const isInitialMount = useRef(true);
  const lastUrlUpdate = useRef<string>('');
  
  const categoryFilteredProducts = useMemo(() => {
    return products;
  }, [products]);
  
  const availableSizes = useMemo(() => {
    return getAvailableSizes(categoryFilteredProducts);
  }, [categoryFilteredProducts]);

  // Distinct colors from all products in current view (deduped by hex)
  const availableColors = useMemo(() => {
    const colorMap = new Map<string, ColorOption>();
    for (const product of categoryFilteredProducts) {
      for (const c of getProductColors(product.variants)) {
        if (!colorMap.has(c.hex)) colorMap.set(c.hex, c);
      }
    }
    return Array.from(colorMap.values());
  }, [categoryFilteredProducts]);
  
  const priceBounds = useMemo(() => {
    return getPriceMinMax(categoryFilteredProducts, userMode);
  }, [categoryFilteredProducts, userMode]);
  
  // Sincronizar estado com URL quando categoria/bounds mudam
  // NÃO chamar updateUrlParams aqui para evitar loop
  useEffect(() => {
    const params = parseUrlParams();
    const validSizes = params.sizes.filter(size => availableSizes.includes(size));

    let validPriceMin = params.priceMin;
    let validPriceMax = params.priceMax;

    if (validPriceMin !== null && (validPriceMin < priceBounds.min || validPriceMin > priceBounds.max)) {
      validPriceMin = null;
    }
    if (validPriceMax !== null && (validPriceMax < priceBounds.min || validPriceMax > priceBounds.max)) {
      validPriceMax = null;
    }

    setSelectedSizes(validSizes);
    setPriceMin(validPriceMin);
    setPriceMax(validPriceMax);
    setSortByState(params.sort);
  }, [activeCategory, availableSizes, priceBounds]);

  // Debounced URL sync - separado para evitar loops
  const debouncedUrlSync = useDebounce((sizes: string[], min: number | null, max: number | null, sort: SortOption) => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const urlKey = `${sizes.join(',')}-${min}-${max}-${sort}`;
    if (urlKey !== lastUrlUpdate.current) {
      lastUrlUpdate.current = urlKey;
      updateUrlParams(sizes, min, max, sort);
    }
  }, 300);

  // Sync URL quando filtros mudam (com debounce)
  useEffect(() => {
    debouncedUrlSync(selectedSizes, priceMin, priceMax, sortBy);
  }, [selectedSizes, priceMin, priceMax, sortBy, debouncedUrlSync]);

  useEffect(() => {
    const handlePopState = () => {
      const params = parseUrlParams();
      const validSizes = params.sizes.filter(size => availableSizes.includes(size));
      
      let validPriceMin = params.priceMin;
      let validPriceMax = params.priceMax;
      
      if (validPriceMin !== null && (validPriceMin < priceBounds.min || validPriceMin > priceBounds.max)) {
        validPriceMin = null;
      }
      if (validPriceMax !== null && (validPriceMax < priceBounds.min || validPriceMax > priceBounds.max)) {
        validPriceMax = null;
      }
      
      setSelectedSizes(validSizes);
      setPriceMin(validPriceMin);
      setPriceMax(validPriceMax);
      setSortByState(params.sort);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [availableSizes, priceBounds]);
  
  const sizeCounts = useMemo(() => {
    return getSizeCounts(categoryFilteredProducts);
  }, [categoryFilteredProducts]);
  
  const filteredProducts = useMemo(() => {
    let result = categoryFilteredProducts;

    if (selectedSizes.length > 0) {
      result = filterProductsBySize(result, selectedSizes);
    }

    if (selectedColors.length > 0) {
      result = result.filter(product =>
        product.variants?.some(v => v.color_hex && selectedColors.includes(v.color_hex))
      );
    }

    result = filterProductsByPriceMinMax(result, priceMin, priceMax, userMode);

    return result;
  }, [categoryFilteredProducts, selectedSizes, selectedColors, priceMin, priceMax, userMode]);
  
  const filteredAndSortedProducts = useMemo(() => {
    return sortProducts(filteredProducts, sortBy, userMode);
  }, [filteredProducts, sortBy, userMode]);
  
  // Funções que apenas atualizam estado - URL sync é feito pelo effect debounced
  const toggleSize = useCallback((size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  }, []);

  const toggleColor = useCallback((hex: string) => {
    setSelectedColors(prev =>
      prev.includes(hex)
        ? prev.filter(c => c !== hex)
        : [...prev, hex]
    );
  }, []);

  const setPriceRange = useCallback((min: number | null, max: number | null) => {
    setPriceMin(min);
    setPriceMax(max);
  }, []);

  const setSortBy = useCallback((sort: SortOption) => {
    setSortByState(sort);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceMin(null);
    setPriceMax(null);
    setSortByState('relevance');
  }, []);
  
  const hasActiveFilters = useMemo(() => {
    return selectedSizes.length > 0 || selectedColors.length > 0 || priceMin !== null || priceMax !== null || sortBy !== 'relevance';
  }, [selectedSizes, selectedColors, priceMin, priceMax, sortBy]);
  
  return {
    selectedSizes,
    selectedColors,
    priceMin,
    priceMax,
    sortBy,
    availableSizes,
    availableColors,
    priceBounds,
    sizeCounts,
    filteredAndSortedProducts,
    toggleSize,
    toggleColor,
    setPriceRange,
    setSortBy,
    clearFilters,
    hasActiveFilters
  };
}
