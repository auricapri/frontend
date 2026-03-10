import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, UserMode, Category, Collection, Coupon } from '../../types';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Locale } from '../../i18n';
import { Gender } from '../../constants/enums';
import { filterProductsForMode } from '../../utils/product';
import { createGetLoc } from '../../utils/localization';
import { useProductFilters } from '../../hooks/useProductFilters';
import { FilterSidebar } from './FilterSidebar';
import { QuickAddModal } from './QuickAddModal';
import { useCartContext } from '../../context/CartContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FilterBottomSheet } from './FilterBottomSheet';
import { FilterContent } from './FilterContent';
import { ProductFilters } from './ProductFilters';
import { CollectionCard } from './CollectionCard';
import { CartIncentiveBanner } from './CartIncentiveBanner';
import { ProductGridBody } from './ProductGridBody';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  coupons?: Coupon[];
  userMode: UserMode;
  onSelectProduct: (product: Product) => void;
  onSelectCollection: (collection: Collection) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onAddToCart?: (item: any) => void;
  onGoToCart?: () => void;
  t: (key: string) => string;
  locale: Locale;
  isLoading?: boolean;
  selectedGender?: Gender;
  onGenderChange?: (gender: Gender) => void;
}

const ITEMS_PER_PAGE = 12;

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  collections,
  coupons = [],
  userMode,
  onSelectProduct,
  onSelectCollection,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onGoToCart,
  t,
  locale,
  isLoading,
  selectedGender: externalGender,
  onGenderChange,
}) => {
  const { cartItems, subtotal } = useCartContext();
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [quickAddColorHex, setQuickAddColorHex] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [internalGender, setInternalGender] = useState<Gender>(Gender.FEMALE);
  const isMobile = useIsMobile();

  const selectedGender = externalGender ?? internalGender;

  const getLoc = useMemo(() => createGetLoc(locale), [locale]);

  const scrollToFilters = () => {
    const mainContainer = document.getElementById('main-content');
    const anchor = document.getElementById('grid-anchor');
    if (anchor && mainContainer) {
      const anchorRect = anchor.getBoundingClientRect();
      const containerRect = mainContainer.getBoundingClientRect();
      const currentScroll = mainContainer.scrollTop;
      const relativeTop = anchorRect.top - containerRect.top;
      mainContainer.scrollTo({ top: currentScroll + relativeTop - 100, behavior: 'smooth' });
    }
  };

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
    setTimeout(scrollToFilters, 100);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    setTimeout(scrollToFilters, 100);
  }, []);

  const handleToggleFilters = useCallback(() => setIsFiltersOpen((prev) => !prev), []);

  const handleGenderChange = useCallback((gender: Gender) => {
    if (onGenderChange) {
      onGenderChange(gender);
    } else {
      setInternalGender(gender);
    }
    setActiveCategory('All');
  }, [onGenderChange]);

  const handleQuickAdd = useCallback((product: Product, colorHex?: string | null) => {
    setQuickAddProduct(product);
    setQuickAddColorHex(colorHex || null);
  }, []);

  const categoryFilteredProducts = useMemo(() => {
    const modeFiltered = filterProductsForMode(products, userMode);
    const productsInLocale = modeFiltered.filter((p) => {
      const name = getLoc(p.name);
      return name && name.trim() !== '';
    });
    const genderFiltered = productsInLocale.filter((p) => {
      const productGender = p.gender || Gender.FEMALE;
      return productGender === selectedGender || productGender === Gender.UNISEX;
    });
    if (activeCategory === 'All') return genderFiltered;
    const cat = categories.find((c) => getLoc(c.name) === activeCategory);
    return genderFiltered.filter((p) => p.category_id === cat?.id);
  }, [activeCategory, products, categories, selectedGender, locale, userMode]);

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
    hasActiveFilters,
  } = useProductFilters({ products: categoryFilteredProducts, activeCategory, userMode });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedSizes, selectedColorFamilies, priceMin, priceMax, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const currentProducts = useMemo(
    () => filteredAndSortedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [currentPage, filteredAndSortedProducts],
  );

  const activeFilterCount =
    selectedSizes.length + selectedColorFamilies.length + (priceMin !== null || priceMax !== null ? 1 : 0);

  return (
    <section id="collection" className="w-full bg-white flex flex-col pt-4 md:pt-20 pb-4">

      {onGoToCart && (
        <CartIncentiveBanner
          itemCount={itemCount}
          subtotal={subtotal}
          locale={locale}
          onGoToCart={onGoToCart}
        />
      )}

      {/* Collections Section */}
      {collections.length > 0 && (
        <div className="mb-4 overflow-hidden">
          <div className="px-6 md:px-12 mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-light tracking-tight uppercase mb-2">{t('nav.collection')}</h2>
              <p className="text-[10px] text-neutral-400 tracking-[0.2em] uppercase font-bold">{t('grid.curated')}</p>
            </div>
          </div>

          <div className="relative group/scroll">
            <div
              className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory gap-6 px-6 md:px-12 no-scrollbar max-w-full"
              id="collections-scroller"
            >
              {!isLoading && collections.map((coll) => (
                <CollectionCard
                  key={coll.id}
                  collection={coll}
                  getLoc={getLoc}
                  onSelect={onSelectCollection}
                  locale={locale}
                />
              ))}
            </div>
            {collections.length > 2 && (
              <>
                <button
                  onClick={() => document.getElementById('collections-scroller')?.scrollBy({ left: -300, behavior: 'smooth' })}
                  className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-white z-10"
                  aria-label="Anterior"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => document.getElementById('collections-scroller')?.scrollBy({ left: 300, behavior: 'smooth' })}
                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-white z-10"
                  aria-label="Próximo"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div id="grid-anchor" className="w-full h-1" />

      <ProductFilters
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        isFiltersOpen={isFiltersOpen}
        onToggleFilters={handleToggleFilters}
        activeFilterCount={activeFilterCount}
        locale={locale}
        t={t}
      />

      <div>
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
              locale={locale}
              t={t}
              isMobile={true}
            />
          </FilterBottomSheet>
        )}

        <ProductGridBody
          products={currentProducts}
          isLoading={!!isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          hasActiveFilters={hasActiveFilters}
          userMode={userMode}
          locale={locale}
          coupons={coupons}
          wishlistIds={wishlistIds}
          selectedColorFamilies={selectedColorFamilies}
          itemsPerPage={ITEMS_PER_PAGE}
          onToggleWishlist={onToggleWishlist}
          onAddToCart={onAddToCart}
          onQuickAdd={handleQuickAdd}
          onSelectProduct={onSelectProduct}
          onClearFilters={clearFilters}
          onPageChange={handlePageChange}
          t={t}
        />
      </div>

      {quickAddProduct && onAddToCart && (
        <QuickAddModal
          product={quickAddProduct}
          isOpen={!!quickAddProduct}
          onClose={() => { setQuickAddProduct(null); setQuickAddColorHex(null); }}
          onAddToCart={(item) => {
            onAddToCart(item);
            setQuickAddProduct(null);
            setQuickAddColorHex(null);
          }}
          userMode={userMode}
          locale={locale}
          getLoc={getLoc}
          coupons={coupons}
          initialColorHex={quickAddColorHex || undefined}
        />
      )}
    </section>
  );
};

export default ProductGrid;
