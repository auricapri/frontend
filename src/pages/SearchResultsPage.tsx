import React, { useState, useMemo, useEffect } from 'react';
import { Product, UserMode } from '../types';
import { Locale } from '../i18n';
import { searchProducts } from '../utils/productFilters';
import { calculatePrice } from '../utils/product';
import { createGetLoc } from '../utils/localization';
import { unslugify } from '../utils/urlUtils';
import { Heart, ArrowLeft, ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import { useProductFilters } from '../hooks/useProductFilters';
import { useIsMobile } from '../hooks/useIsMobile';
import { FilterSidebar } from '../components/product/FilterSidebar';
import { FilterBottomSheet } from '../components/product/FilterBottomSheet';
import { FilterContent } from '../components/product/FilterContent';

interface SearchResultsPageProps {
  products: Product[];
  searchSlug: string;
  locale: Locale;
  t: (key: string) => string;
  userMode: UserMode;
  onSelectProduct: (product: Product) => void;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onBack: () => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  products,
  searchSlug,
  locale,
  t,
  userMode,
  onSelectProduct,
  wishlistIds,
  onToggleWishlist,
  onBack,
}) => {
  const getLoc = useMemo(() => createGetLoc(locale), [locale]);

  // Convert slug back to readable query
  const searchQuery = unslugify(searchSlug);

  // Filter products by search query first
  const searchFilteredProducts = useMemo(() => {
    return searchProducts(searchQuery, products, locale);
  }, [searchQuery, products, locale]);

  // Apply additional filters (size, price, sort)
  const {
    selectedSizes,
    priceMin,
    priceMax,
    sortBy,
    availableSizes,
    priceBounds,
    sizeCounts,
    filteredAndSortedProducts,
    toggleSize,
    setPriceRange,
    setSortBy,
    clearFilters,
    hasActiveFilters
  } = useProductFilters({
    products: searchFilteredProducts,
    activeCategory: 'All',
    userMode
  });

  // Filter state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const isMobile = useIsMobile();
  const activeFilterCount = selectedSizes.length + (priceMin !== null || priceMax !== null ? 1 : 0);

  // Pagination
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const currentProducts = useMemo(() => {
    return filteredAndSortedProducts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [currentPage, filteredAndSortedProducts]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSizes, priceMin, priceMax, sortBy, searchQuery]);

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header + Filters */}
      <div className="sticky top-24 md:top-20 z-30 bg-white">
        {/* Header */}
        <div className="border-b border-neutral-100 py-3 md:py-4 px-6 md:px-12">
          <h1 className="text-xl md:text-2xl font-light tracking-[0.2em] uppercase mb-1">
            {t('search.resultsTitle')}
          </h1>
          <p className="text-neutral-500 text-xs md:text-sm">
            {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? t('search.resultSingular') : t('search.resultPlural')}
            {searchQuery && ` para "${searchQuery}"`}
          </p>
        </div>

        {/* Filters Bar */}
        <div className="border-b border-neutral-100 py-3 md:py-4 px-4 md:px-12">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setIsFiltersOpen(prev => !prev)}
            className={`flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-[9px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-bold transition-all ${
              isFiltersOpen
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {isFiltersOpen ? <X className="w-3.5 h-3.5" /> : <SlidersHorizontal className="w-3.5 h-3.5" />}
            <span>{isFiltersOpen ? t('grid.hideFilters') : t('grid.showFilters')}</span>
            {activeFilterCount > 0 && !isFiltersOpen && (
              <span className="ml-0.5 w-5 h-5 flex items-center justify-center bg-neutral-900 text-white text-[9px] font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        </div>
      </div>

      {/* Mobile: Bottom Sheet */}
      {isMobile && (
        <FilterBottomSheet
          isOpen={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          hasActiveFilters={hasActiveFilters}
          productCount={filteredAndSortedProducts.length}
          onClear={clearFilters}
          t={t}
        >
          <FilterContent
            availableSizes={availableSizes}
            selectedSizes={selectedSizes}
            sizeCounts={sizeCounts}
            priceBounds={priceBounds}
            priceMin={priceMin}
            priceMax={priceMax}
            sortBy={sortBy}
            toggleSize={toggleSize}
            setPriceRange={setPriceRange}
            setSortBy={setSortBy}
            locale={locale}
            t={t}
            isMobile={true}
          />
        </FilterBottomSheet>
      )}

      {/* Desktop + Mobile Layout */}
      <div className="flex px-6 md:px-12 pt-6 md:pt-8">
        {/* Desktop: Sidebar */}
        {!isMobile && (
          <FilterSidebar
            isOpen={isFiltersOpen}
            onClose={() => setIsFiltersOpen(false)}
            availableSizes={availableSizes}
            selectedSizes={selectedSizes}
            sizeCounts={sizeCounts}
            toggleSize={toggleSize}
            priceBounds={priceBounds}
            priceMin={priceMin}
            priceMax={priceMax}
            setPriceRange={setPriceRange}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onClear={clearFilters}
            onApply={() => setIsFiltersOpen(false)}
            hasActiveFilters={hasActiveFilters}
            productCount={filteredAndSortedProducts.length}
            locale={locale}
            t={t}
          />
        )}

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {/* Results count + clear filters */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">
              {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? t('search.resultSingular') : t('search.resultPlural')}
            </p>
            {hasActiveFilters && !isMobile && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 underline transition-colors"
              >
                {t('grid.clearFilters')}
              </button>
            )}
          </div>

          {/* Grid */}
          {currentProducts.length > 0 ? (
            <div className={`grid ${
              isFiltersOpen && !isMobile
                ? 'grid-cols-3'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            } gap-4 md:gap-6`}>
              {currentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  userMode={userMode}
                  locale={locale}
                  getLoc={getLoc}
                  onSelect={onSelectProduct}
                  isWishlisted={wishlistIds.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-neutral-400 mb-2">
                {t('search.noResults')}
              </p>
              <p className="text-sm text-neutral-500">
                {t('search.tryDifferent')}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-8 mt-20 mb-12">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-3 border border-neutral-200 rounded-full hover:bg-neutral-900 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                aria-label={t('grid.previousPage')}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">
                  {t('grid.page')}
                </span>
                <span className="text-lg font-light tabular-nums">
                  {currentPage} <span className="text-neutral-300 text-sm">/ {totalPages}</span>
                </span>
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-3 border border-neutral-200 rounded-full hover:bg-neutral-900 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                aria-label={t('grid.nextPage')}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ProductCard component
interface ProductCardProps {
  product: Product;
  userMode: UserMode;
  locale: Locale;
  getLoc: (obj: any) => string;
  onSelect: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  userMode,
  getLoc,
  onSelect,
  isWishlisted,
  onToggleWishlist,
  locale,
}) => {
  const mainVariant = product.variants?.[0];
  const price = mainVariant ? calculatePrice(mainVariant, userMode, product) : 0;
  const displayImg = product.default_image_url || product.base_images?.[0];

  const formattedPrice = new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: locale === 'pt' ? 'BRL' : 'USD'
  }).format(price);

  return (
    <div className="group cursor-pointer" onClick={() => onSelect(product)}>
      <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden mb-3">
        {displayImg && (
          <img
            src={displayImg}
            alt={getLoc(product.name)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-400'}`}
            strokeWidth={1.5}
          />
        </button>
      </div>
      <h3 className="text-sm font-medium mb-1 line-clamp-2 tracking-wide">
        {getLoc(product.name)}
      </h3>
      <p className="text-sm text-neutral-600 font-light">
        {formattedPrice}
      </p>
    </div>
  );
};
