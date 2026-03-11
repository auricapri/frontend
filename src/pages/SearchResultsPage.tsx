import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Product, UserMode } from '../types';
import { Locale } from '../i18n';
import { searchProducts } from '../utils/productFilters';
import { createGetLoc } from '../utils/localization';
import { unslugify } from '../utils/urlUtils';
import { ArrowLeft, ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import { useProductFilters } from '../hooks/useProductFilters';
import { useIsMobile } from '../hooks/useIsMobile';
import { FilterSidebar } from '../components/product/FilterSidebar';
import { FilterBottomSheet } from '../components/product/FilterBottomSheet';
import { FilterContent } from '../components/product/FilterContent';
import { ProductCard } from '../components/product/ProductCard';

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
    <div className="bg-paper pt-2 pb-4">
      <SEOHead
        title={`Busca: ${searchQuery} | Auricapri`}
        description={`Resultados de busca para "${searchQuery}" na Auricapri.`}
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Header + Filters */}
      <div className="bg-paper">
        {/* Header */}
        <div className="border-b border-neutral-100 py-3 md:py-4 px-6 md:px-12">
          <h1 className="font-serif text-xl md:text-2xl font-light tracking-[0.2em] uppercase mb-1">
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
            className={`flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-[10px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-bold transition-all ${
              isFiltersOpen
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {isFiltersOpen ? <X className="w-3.5 h-3.5" /> : <SlidersHorizontal className="w-3.5 h-3.5" />}
            <span>{isFiltersOpen ? t('grid.hideFilters') : t('grid.showFilters')}</span>
            {activeFilterCount > 0 && !isFiltersOpen && (
              <span className="ml-0.5 w-5 h-5 flex items-center justify-center bg-neutral-900 text-white text-[10px] font-bold rounded-full">
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
            availableColorFamilies={availableColorFamilies}
            selectedColorFamilies={selectedColorFamilies}
            toggleColorFamily={toggleColorFamily}
            setPriceRange={setPriceRange}
            setSortBy={setSortBy}
            locale={locale}
            t={t}
            isMobile={true}
          />
        </FilterBottomSheet>
      )}

      {/* Desktop + Mobile Layout */}
      <div className="px-6 md:px-12 mt-4">
        {/* Desktop: Sidebar (fixed overlay) */}
        {!isMobile && (
          <FilterSidebar
            isOpen={isFiltersOpen}
            onClose={() => setIsFiltersOpen(false)}
            availableSizes={availableSizes}
            selectedSizes={selectedSizes}
            sizeCounts={sizeCounts}
            toggleSize={toggleSize}
            availableColorFamilies={availableColorFamilies}
            selectedColorFamilies={selectedColorFamilies}
            toggleColorFamily={toggleColorFamily}
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
        <div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {currentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  userMode={userMode}
                  locale={locale}
                  variant="grid"
                  showWishlist={true}
                  showQuickAdd={false}
                  showDiscountBadge={true}
                  showColorSwatches={true}
                  isWishlisted={wishlistIds.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                  onClick={() => onSelectProduct(product)}
                />
              ))}
            </div>
          ) : (
            <div className="py-20">
              <div className="text-center mb-12">
                <p className="text-xl text-neutral-400 mb-2">
                  {t('search.noResults')}
                </p>
                <p className="text-sm text-neutral-500">
                  {t('search.tryDifferent')}
                </p>
              </div>

              {/* Popular Products */}
              {(() => {
                const highlightProducts = products.filter(p => p.is_highlight);
                const popularProducts = highlightProducts.length > 0
                  ? highlightProducts.slice(0, 4)
                  : products.slice(0, 4);
                if (popularProducts.length === 0) return null;
                return (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-600 mb-6">
                      {t('search.popularProducts')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4">
                      {popularProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          userMode={userMode}
                          locale={locale}
                          variant="grid"
                          showWishlist={true}
                          showQuickAdd={false}
                          showDiscountBadge={true}
                          showColorSwatches={true}
                          isWishlisted={wishlistIds.includes(product.id)}
                          onToggleWishlist={onToggleWishlist}
                          onClick={() => onSelectProduct(product)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
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
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">
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
