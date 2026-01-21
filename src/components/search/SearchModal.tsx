import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, UserMode, Category } from '../../types';
import { X, Search as SearchIcon, SlidersHorizontal, Heart, Tag, ShoppingBag } from 'lucide-react';
import { Locale } from '../../i18n';
import { createGetLoc } from '../../utils/localization';
import { formatCurrency } from '../../utils/currency';
import { calculatePrice, filterProductsForMode } from '../../utils/product';
import { useProductFilters } from '../../hooks/useProductFilters';
import { FilterContent } from '../product/FilterContent';
import { searchProducts } from '../../utils/productFilters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
  locale: Locale;
  t: (key: string) => string;
  userMode: UserMode;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  onSelectProduct,
  locale,
  t,
  userMode,
  wishlistIds,
  onToggleWishlist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getLoc = useMemo(() => createGetLoc(locale), [locale]);

  // Product filters hook
  const {
    selectedSizes,
    priceRange: { min: priceMin, max: priceMax },
    selectedSort,
    toggleSize,
    setPriceRange,
    setSort,
    resetFilters,
    hasActiveFilters,
  } = useProductFilters();

  // Filter products for current user mode
  const modeFilteredProducts = useMemo(
    () => filterProductsForMode(products, userMode),
    [products, userMode]
  );

  // Search products
  const searchedProducts = useMemo(
    () => searchProducts(searchQuery, modeFilteredProducts, locale),
    [searchQuery, modeFilteredProducts, locale]
  );

  // Apply filters (size, price, sort)
  const filteredProducts = useMemo(() => {
    let result = searchedProducts;

    // Filter by size
    if (selectedSizes.length > 0) {
      result = result.filter(p =>
        p.variants?.some(v =>
          selectedSizes.includes(v.size || '')
        )
      );
    }

    // Filter by price
    if (priceMin !== null || priceMax !== null) {
      result = result.filter(p => {
        const variant = p.variants?.[0];
        if (!variant) return false;
        const price = calculatePrice(variant, userMode);
        if (priceMin !== null && price < priceMin) return false;
        if (priceMax !== null && price > priceMax) return false;
        return true;
      });
    }

    // Sort
    if (selectedSort === 'price-asc') {
      result = [...result].sort((a, b) => {
        const priceA = calculatePrice(a.variants?.[0] || {} as any, userMode);
        const priceB = calculatePrice(b.variants?.[0] || {} as any, userMode);
        return priceA - priceB;
      });
    } else if (selectedSort === 'price-desc') {
      result = [...result].sort((a, b) => {
        const priceA = calculatePrice(a.variants?.[0] || {} as any, userMode);
        const priceB = calculatePrice(b.variants?.[0] || {} as any, userMode);
        return priceB - priceA;
      });
    } else if (selectedSort === 'name-asc') {
      result = [...result].sort((a, b) =>
        getLoc(a.name).localeCompare(getLoc(b.name))
      );
    }

    return result;
  }, [searchedProducts, selectedSizes, priceMin, priceMax, selectedSort, userMode, getLoc]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC key listener
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Reset search and filters when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      resetFilters();
      setIsFiltersOpen(false);
    }
  }, [isOpen, resetFilters]);

  // Count active filters
  const activeFilterCount = selectedSizes.length + (priceMin !== null || priceMax !== null ? 1 : 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light uppercase tracking-wide">{t('search.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="mt-4 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors text-sm"
          />
        </div>

        {/* Filter Toggle */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
              isFiltersOpen
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isFiltersOpen ? t('grid.hideFilters') : t('grid.showFilters')}</span>
            {activeFilterCount > 0 && !isFiltersOpen && (
              <span className="ml-1 w-5 h-5 flex items-center justify-center bg-neutral-900 text-white text-[9px] font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
            >
              {t('grid.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel (Collapsible) */}
      {isFiltersOpen && (
        <div className="flex-shrink-0 border-b border-neutral-200 px-6 py-4 bg-neutral-50">
          <FilterContent
            selectedSizes={selectedSizes}
            priceRange={{ min: priceMin, max: priceMax }}
            selectedSort={selectedSort}
            onToggleSize={toggleSize}
            onPriceChange={setPriceRange}
            onSortChange={setSort}
            onClear={resetFilters}
            onApply={() => {}}
            hasActiveFilters={hasActiveFilters}
            productCount={filteredProducts.length}
            locale={locale}
            t={t}
          />
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Results Count */}
        {searchQuery && (
          <div className="mb-6">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? t('search.resultSingular') : t('search.resultPlural')}
            </p>
          </div>
        )}

        {/* Empty States */}
        {!searchQuery ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon className="w-12 h-12 text-neutral-200 mb-4" />
            <p className="text-sm text-neutral-400">{t('search.emptyState')}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-neutral-600 mb-2">{t('search.noResults')}</p>
            <p className="text-xs text-neutral-400">{t('search.tryDifferent')}</p>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const mainVariant = p.variants?.[0];
              const price = mainVariant ? calculatePrice(mainVariant, userMode) : 0;
              const displayImg = p.default_image_url || p.base_images?.[0];
              const isWishlisted = wishlistIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProduct(p);
                    onClose();
                  }}
                  className="cursor-pointer group flex flex-col relative border border-neutral-200 hover:border-neutral-300 transition-colors rounded-lg overflow-hidden"
                >
                  <div className="relative aspect-square overflow-hidden bg-neutral-50">
                    <img
                      src={displayImg}
                      alt={getLoc(p.name)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(p.id);
                      }}
                      aria-label="Toggle wishlist"
                      className={`absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm transition-all ${
                        isWishlisted ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-900'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 space-y-1">
                    <h3 className="text-xs font-medium text-neutral-900 leading-tight truncate">
                      {getLoc(p.name)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(price, locale)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
