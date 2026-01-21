
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, UserMode, Category, Collection, Coupon, LocalizedText } from '../../types';
import { Heart, ArrowLeft, ArrowRight, Tag, SlidersHorizontal, X, ShoppingBag } from 'lucide-react';
import { Locale } from '../../i18n';
import { Gender } from '../../constants/enums';
import { formatCurrency } from '../../utils/currency';
import { calculatePrice, filterProductsForMode } from '../../utils/product';
import { createGetLoc } from '../../utils/localization';
import { useProductFilters } from '../../hooks/useProductFilters';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FilterBottomSheet } from './FilterBottomSheet';
import { FilterSidebar } from './FilterSidebar';
import { FilterContent } from './FilterContent';
import { QuickAddModal } from './QuickAddModal';

// Helper to extract unique colors from product variants
const getProductColors = (product: Product): Array<{ hex: string; name: LocalizedText }> => {
  const colors = new Map<string, LocalizedText>();
  product.variants?.forEach(v => {
    if (v.color_hex && !colors.has(v.color_hex)) {
      colors.set(v.color_hex, v.color_name);
    }
  });
  return Array.from(colors.entries()).map(([hex, name]) => ({ hex, name }));
};

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
  t,
  locale,
  isLoading,
  selectedGender: externalGender,
  onGenderChange
}) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [internalGender, setInternalGender] = useState<Gender>(Gender.FEMALE);
  const isMobile = useIsMobile();

  // Use external gender if provided, otherwise use internal state
  const selectedGender = externalGender ?? internalGender;
  const handleGenderChange = (gender: Gender) => {
    if (onGenderChange) {
      onGenderChange(gender);
    } else {
      setInternalGender(gender);
    }
    setActiveCategory("All"); // Reset category filter when changing gender
  };

  // All categories are shown regardless of gender
  // Gender filter only applies to products
  const filteredCategories = categories;

  // Use shared localization utility
  const getLoc = useMemo(() => createGetLoc(locale), [locale]);

  const scrollToFilters = () => {
    // Specific container from App.tsx
    const mainContainer = document.getElementById('main-scroll-container');
    // Non-sticky anchor point above filters
    const anchor = document.getElementById('grid-anchor');

    if (anchor && mainContainer) {
        // Since anchor is just a div in flow, offsetTop gives its distance from the closest positioned ancestor (likely main or section)
        // If main is positioned (relative), offsetTop is distance from top of main's content.

        // However, if main content is large, offsetTop can be large.
        // We need to scroll main to this position minus navbar.

        // Get the top position relative to the document/viewport to be safe
        const anchorRect = anchor.getBoundingClientRect();
        const containerRect = mainContainer.getBoundingClientRect();

        // Current scroll position of the container
        const currentScroll = mainContainer.scrollTop;

        // Calculate the absolute position of the anchor relative to the scroll view content start
        // anchorRect.top is viewport relative. containerRect.top is viewport relative.
        // The difference is how far down the anchor is from the top of the container's visible area.
        // Add currentScroll to get the absolute scroll position needed.

        const relativeTop = anchorRect.top - containerRect.top;

        // Target: We want the anchor to be about 100px from top (below navbar)
        const headerOffset = 100;
        const targetScroll = currentScroll + relativeTop - headerOffset;

        mainContainer.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }
  };

  const handleFilterClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    setCurrentPage(1);
    // Timeout ensures React render cycle completes and layout stabilizes before scrolling
    setTimeout(scrollToFilters, 100);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTimeout(scrollToFilters, 100);
  };

  const categoryFilteredProducts = useMemo(() => {
    const modeFiltered = filterProductsForMode(products, userMode);

    const productsInLocale = modeFiltered.filter(p => {
      const name = getLoc(p.name);
      return name && name.trim() !== '';
    });

    // Filter by gender - products without gender default to FEMALE
    const genderFiltered = productsInLocale.filter(p => {
      const productGender = p.gender || Gender.FEMALE; // Default to female if not set
      return productGender === selectedGender || productGender === Gender.UNISEX;
    });

    if (activeCategory === "All") return genderFiltered;

    const cat = filteredCategories.find(c => getLoc(c.name) === activeCategory);
    return genderFiltered.filter(p => p.category_id === cat?.id);
  }, [activeCategory, products, filteredCategories, selectedGender, locale, userMode]);

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
    products: categoryFilteredProducts,
    activeCategory,
    userMode
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedSizes, priceMin, priceMax, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const currentProducts = useMemo(() => {
    return filteredAndSortedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [currentPage, filteredAndSortedProducts]);

  // Helper to calculate discounted price
  const getDisplayPrice = (product: Product, originalPrice: number) => {
    const activeCoupon = coupons.find(c => c.product_ids?.includes(product.id));
    if (!activeCoupon) return { original: originalPrice, final: originalPrice, hasDiscount: false, discountDisplay: '' };

    let final = originalPrice;
    let discountDisplay = '';

    if (activeCoupon.discount_type === 'percentage') {
        final = originalPrice * (1 - activeCoupon.discount_value / 100);
        discountDisplay = `${activeCoupon.discount_value}%`;
    } else {
        final = Math.max(0, originalPrice - activeCoupon.discount_value);
        discountDisplay = `R$${activeCoupon.discount_value}`;
    }

    return { original: originalPrice, final, hasDiscount: true, code: activeCoupon.code, discountDisplay };
  };

  // Count active filters for badge
  const activeFilterCount = selectedSizes.length + (priceMin !== null || priceMax !== null ? 1 : 0);

  return (
    <section id="collection" className="w-full bg-white flex flex-col pt-32 pb-40">

      {/* Collections Section */}
      <div className="mb-32">
        <div className="px-6 md:px-12 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-light tracking-tight uppercase mb-2">{t('nav.collection')}</h2>
            <p className="text-[10px] text-neutral-400 tracking-[0.2em] uppercase font-bold">{t('grid.curated')}</p>
          </div>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-6 md:px-12 no-scrollbar">
          {!isLoading && collections.map((coll) => (
            <div key={coll.id} onClick={() => onSelectCollection(coll)} className="flex-none w-[70vw] md:w-[35vw] snap-center group relative cursor-pointer aspect-[16/9] overflow-hidden bg-neutral-100 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm">
               <img src={coll.image_url} alt={getLoc(coll.name)} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" />
               <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-8 text-white">
                  <h3 className="text-2xl font-light tracking-widest uppercase">{getLoc(coll.name)}</h3>
                  <div className="w-0 group-hover:w-full h-[1px] bg-white transition-all duration-500 mt-2 opacity-50" />
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anchor for Scrolling (Non-sticky) */}
      <div id="grid-anchor" className="w-full h-1" />

      {/* Filters Sticky Bar - Categories + Filter Toggle */}
      <div id="product-filters" className="sticky top-16 md:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 py-3 md:py-4 px-4 md:px-12 mb-6 md:mb-8 transition-all">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsFiltersOpen(prev => !prev)}
            className={`flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-[9px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-bold transition-all ${
              isFiltersOpen
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-100'
            }`}
            aria-label={isFiltersOpen ? 'Ocultar filtros' : 'Exibir filtros'}
            aria-expanded={isFiltersOpen}
          >
            {isFiltersOpen ? (
              <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
            ) : (
              <SlidersHorizontal className="w-3 h-3 md:w-3.5 md:h-3.5" />
            )}
            <span className="hidden sm:inline">{isFiltersOpen ? t('grid.hideFilters') || 'Ocultar' : t('grid.showFilters') || 'Filtros'}</span>
            <span className="sm:hidden">{isFiltersOpen ? 'Ocultar' : 'Filtros'}</span>
            {activeFilterCount > 0 && !isFiltersOpen && (
              <span className="ml-0.5 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center bg-neutral-900 text-white text-[8px] md:text-[9px] font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Category Pills - Horizontal Scroll */}
          <div className="flex-1 flex overflow-x-auto no-scrollbar gap-1.5 md:gap-2">
            <button
              onClick={() => handleFilterClick("All")}
              className={`flex-shrink-0 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.15em] font-bold transition-all border ${
                activeCategory === "All"
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'text-neutral-600 border-neutral-200 active:border-neutral-400'
              }`}
              aria-pressed={activeCategory === "All"}
            >
              {t('grid.allItems')}
            </button>
            {filteredCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleFilterClick(getLoc(cat.name))}
                className={`flex-shrink-0 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.15em] font-bold transition-all border whitespace-nowrap ${
                  activeCategory === getLoc(cat.name)
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'text-neutral-600 border-neutral-200 active:border-neutral-400'
                }`}
                aria-pressed={activeCategory === getLoc(cat.name)}
              >
                {getLoc(cat.name)}
              </button>
            ))}
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

      {/* Main Content Area - Desktop Sidebar + Products */}
      <div className="">
        <div className="flex">
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
              onApply={() => {}}
              hasActiveFilters={hasActiveFilters}
              productCount={filteredAndSortedProducts.length}
              locale={locale}
              t={t}
            />
          )}

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between px-6 md:px-12">
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">
                {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'produto' : 'produtos'}
              </p>
              {hasActiveFilters && !isMobile && (
                <button
                  onClick={clearFilters}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
                >
                  {t('grid.clearFilters')}
                </button>
              )}
            </div>

            {currentProducts.length === 0 && !isLoading ? (
              <div className="py-20 text-center flex flex-col items-center px-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">{t('grid.noItems')}</p>
              </div>
            ) : (
              <div className={`grid ${
                isFiltersOpen && !isMobile
                  ? 'grid-cols-3'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {!isLoading && currentProducts.map(p => {
                    const mainVariant = p.variants?.[0];
                    const rawPrice = mainVariant ? calculatePrice(mainVariant, userMode) : 0;
                    const { original, final, hasDiscount, code, discountDisplay } = getDisplayPrice(p, rawPrice);
                    const displayImg = p.default_image_url || p.base_images[0];
                    const isWishlisted = wishlistIds.includes(p.id);
                    const colors = getProductColors(p);
                    const hasMultipleVariants = (p.variants?.length || 0) > 1;

                    return (
                      <div key={p.id} onClick={() => onSelectProduct(p)} className="cursor-pointer group flex flex-col relative border border-neutral-200 hover:border-neutral-300 transition-colors">
                        <div className="relative aspect-square overflow-hidden bg-neutral-50">
                          <img src={displayImg} alt={getLoc(p.name)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

                          {/* Discount Badge - Domino Style */}
                          {hasDiscount && (
                            <div className="absolute top-2 left-2 flex items-center shadow-lg z-10 rounded overflow-hidden">
                              <div className="bg-white text-black px-2 py-1 flex items-center">
                                <span className="text-[11px] font-black tracking-tight">{discountDisplay}</span>
                              </div>
                              <div className="bg-black text-white px-2 py-1">
                                <span className="text-[11px] font-black tracking-tight">OFF</span>
                              </div>
                            </div>
                          )}

                          {/* Wishlist Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleWishlist(p.id); }}
                            aria-label="Toggle wishlist"
                            className={`absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm transition-all ${isWishlisted ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-900'}`}
                          >
                            <Heart className="w-3.5 h-3.5" fill={isWishlisted ? "currentColor" : "none"} />
                          </button>

                          {/* Quick Add Button with Text Animation */}
                          {onAddToCart && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (hasMultipleVariants) {
                                  setQuickAddProduct(p);
                                } else if (mainVariant) {
                                  onAddToCart({
                                    variant_id: mainVariant.id,
                                    product_id: p.id,
                                    name: p.name,
                                    image: displayImg,
                                    size: mainVariant.size || 'Único',
                                    color_name: mainVariant.color_name,
                                    color_hex: mainVariant.color_hex || '#000',
                                    price: final,
                                    original_price: hasDiscount ? original : undefined,
                                    quantity: 1,
                                    sku: mainVariant.sku
                                  });
                                }
                              }}
                              aria-label={t('product.addToCart')}
                              className="absolute bottom-2 right-2 flex items-center gap-2 bg-black text-white rounded-full shadow-lg transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 overflow-hidden whitespace-nowrap p-2.5 group-hover:pr-4 hover:scale-105 active:scale-95"
                            >
                              <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                              <span className="text-[11px] font-medium uppercase tracking-wider max-w-0 group-hover:max-w-[200px] transition-all duration-300 ease-out opacity-0 group-hover:opacity-100">
                                {t('product.addToCart')}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-3 space-y-1">
                          <h3 className="text-[11px] font-medium text-neutral-900 leading-tight truncate">{getLoc(p.name)}</h3>

                          {/* Price */}
                          <div className="flex items-center gap-2">
                            {hasDiscount && (
                              <span className="text-[10px] text-neutral-400 line-through">
                                {formatCurrency(original, locale)}
                              </span>
                            )}
                            <span className={`text-[12px] font-semibold ${hasDiscount ? 'text-red-600' : 'text-neutral-900'}`}>
                              {formatCurrency(final, locale)}
                            </span>
                          </div>

                          {/* Color Swatches - At bottom */}
                          {colors.length > 0 && (
                            <div className="flex items-center gap-0.5 pt-0.5">
                              {colors.slice(0, 5).map((color) => (
                                <div
                                  key={color.hex}
                                  className="w-2 h-2 rounded-full border border-neutral-300"
                                  style={{ backgroundColor: color.hex }}
                                  title={getLoc(color.name)}
                                />
                              ))}
                              {colors.length > 5 && (
                                <span className="text-[8px] text-neutral-500 font-medium ml-0.5">
                                  +{colors.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex justify-center items-center space-x-8 mt-20">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-3 border border-neutral-200 rounded-full hover:bg-neutral-900 hover:text-white hover:border-neutral-900 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-neutral-900 disabled:hover:border-neutral-200 transition-all"
                  aria-label="Página anterior"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">{t('grid.page')}</span>
                  <span className="text-lg font-light tabular-nums">{currentPage} <span className="text-neutral-300 text-sm">/ {totalPages}</span></span>
                </div>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 border border-neutral-200 rounded-full hover:bg-neutral-900 hover:text-white hover:border-neutral-900 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-neutral-900 disabled:hover:border-neutral-200 transition-all"
                  aria-label="Próxima página"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {quickAddProduct && onAddToCart && (
        <QuickAddModal
          product={quickAddProduct}
          isOpen={!!quickAddProduct}
          onClose={() => setQuickAddProduct(null)}
          onAddToCart={(item) => {
            onAddToCart(item);
            setQuickAddProduct(null);
          }}
          userMode={userMode}
          locale={locale}
          getLoc={getLoc}
        />
      )}
    </section>
  );
};

export default ProductGrid;
