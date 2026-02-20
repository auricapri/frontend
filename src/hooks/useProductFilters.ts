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
import { COLOR_FAMILIES, type ColorFamily, getColorFamilyId } from '../utils/colorFamilies';
import { useDebounce } from './useDebounce';

interface UseProductFiltersParams {
  products: Product[];
  activeCategory: string;
  userMode: UserMode;
}

interface UseProductFiltersReturn {
  selectedSizes: string[];
  selectedColorFamilies: string[];
  priceMin: number | null;
  priceMax: number | null;
  sortBy: SortOption;
  availableSizes: string[];
  availableColorFamilies: ColorFamily[];
  priceBounds: { min: number; max: number };
  sizeCounts: Record<string, number>;
  filteredAndSortedProducts: Product[];
  toggleSize: (size: string) => void;
  toggleColorFamily: (id: string) => void;
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
  const [selectedColorFamilies, setSelectedColorFamilies] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number | null>(urlParams.priceMin);
  const [priceMax, setPriceMax] = useState<number | null>(urlParams.priceMax);
  const [sortBy, setSortByState] = useState<SortOption>(urlParams.sort);

  // Ref para evitar sync de URL no mount inicial
  const isInitialMount = useRef(true);
  const lastUrlUpdate = useRef<string>('');

  const availableSizes = useMemo(() => {
    return getAvailableSizes(products);
  }, [products]);

  // Color families present in the current product set (preserves canonical order)
  // Uses DB color_family when available, falls back to runtime classification
  const availableColorFamilies = useMemo(() => {
    const presentFamilies = new Set<string>();
    for (const product of products) {
      for (const v of product.variants || []) {
        const family = v.color_family || (v.color_hex ? getColorFamilyId(v.color_hex, v.color_name) : null);
        if (family) presentFamilies.add(family);
      }
    }
    return COLOR_FAMILIES.filter(f => presentFamilies.has(f.id));
  }, [products]);

  const priceBounds = useMemo(() => {
    return getPriceMinMax(products, userMode);
  }, [products, userMode]);

  // Sincronizar estado com URL quando categoria/bounds mudam
  // NÃO chamar updateUrlParams aqui para evitar loop
  useEffect(() => {
    const params = parseUrlParams();
    const availableSizeSet = new Set(availableSizes);
    const validSizes = params.sizes.filter(size => availableSizeSet.has(size));

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
    return getSizeCounts(products);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedSizes.length > 0) {
      result = filterProductsBySize(result, selectedSizes);
    }

    if (selectedColorFamilies.length > 0) {
      // Use Set for O(1) lookups
      const familySet = new Set(selectedColorFamilies);
      result = result.filter(product =>
        product.variants?.some(v => {
          const family = v.color_family || (v.color_hex ? getColorFamilyId(v.color_hex, v.color_name) : null);
          return family && familySet.has(family);
        })
      );
    }

    result = filterProductsByPriceMinMax(result, priceMin, priceMax, userMode);

    return result;
  }, [products, selectedSizes, selectedColorFamilies, priceMin, priceMax, userMode]);

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

  const toggleColorFamily = useCallback((id: string) => {
    setSelectedColorFamilies(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : [...prev, id]
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
    setSelectedColorFamilies([]);
    setPriceMin(null);
    setPriceMax(null);
    setSortByState('relevance');
  }, []);

  const hasActiveFilters = useMemo(() => {
    return selectedSizes.length > 0 || selectedColorFamilies.length > 0 || priceMin !== null || priceMax !== null || sortBy !== 'relevance';
  }, [selectedSizes, selectedColorFamilies, priceMin, priceMax, sortBy]);

  return {
    selectedSizes,
    selectedColorFamilies,
    priceMin,
    priceMax,
    sortBy,
    availableSizes,
    availableColorFamilies,
    priceBounds,
    sizeCounts,
    filteredAndSortedProducts,
    toggleSize,
    toggleColorFamily,
    setPriceRange,
    setSortBy,
    clearFilters,
    hasActiveFilters
  };
}
