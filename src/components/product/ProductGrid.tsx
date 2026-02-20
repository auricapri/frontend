
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, UserMode, Category, Collection, Coupon } from '../../types';
import { ArrowLeft, ArrowRight, SlidersHorizontal, X, ShoppingBag } from 'lucide-react';
import { Locale } from '../../i18n';
import { Gender } from '../../constants/enums';
import { filterProductsForMode } from '../../utils/product';
import { createGetLoc } from '../../utils/localization';
import { useProductFilters } from '../../hooks/useProductFilters';
import { FilterSidebar } from './FilterSidebar';
import { QuickAddModal } from './QuickAddModal';
import { ProductCard } from './ProductCard';
import { CountdownBadge, useCollectionAvailability } from '../ui/CountdownBadge';
import { useCartContext } from '../../context/CartContext';

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

// Localized text for collection cards
const COMING_SOON_TEXT: Record<Locale, string> = {
  pt: 'Em breve',
  en: 'Coming soon',
  es: 'Próximamente',
  fr: 'Bientôt',
};

// Collection Card with countdown and expiration handling
interface CollectionCardProps {
  collection: Collection;
  getLoc: (obj: any) => string;
  onSelect: (collection: Collection) => void;
  locale: Locale;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection, getLoc, onSelect, locale }) => {
  const { isAvailable, isExpired } = useCollectionAvailability(collection.starts_at, collection.ends_at);

  // Don't render expired collections at all (after refresh)
  if (isExpired) return null;

  // Check if collection hasn't started yet
  const hasStartDate = !!collection.starts_at;
  const notStartedYet = hasStartDate && new Date(collection.starts_at!) > new Date();
  const hasCountdown = collection.ends_at || notStartedYet;

  const handleClick = () => {
    // Block click if expired or not started
    if (!isAvailable) return;
    onSelect(collection);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex-none w-[65vw] md:w-[35vw] snap-center group relative aspect-[4/3] md:aspect-[16/9] overflow-hidden bg-neutral-100 rounded-2xl md:rounded-[2.5rem] shadow-sm transition-all ${
        isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
      }`}
    >
      <img
        src={collection.image_url}
        alt={getLoc(collection.name)}
        className={`w-full h-full object-cover transition-all duration-1000 ${isAvailable ? 'group-hover:scale-105 group-active:scale-105' : 'grayscale'}`}
      />

      {/* Base overlay with title */}
      <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-4 md:p-8 text-white">
        <h3 className="text-lg md:text-2xl font-light tracking-widest uppercase">{getLoc(collection.name)}</h3>
        <div className={`w-0 h-[1px] bg-white transition-all duration-500 mt-2 opacity-50 ${isAvailable ? 'group-hover:w-full group-active:w-full' : ''}`} />
      </div>

      {/* Countdown overlay - semi-transparent to show image, fades on hover/tap for suspense */}
      {hasCountdown && isAvailable && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-all duration-500 group-hover:opacity-0 group-hover:backdrop-blur-0 group-active:opacity-0">
          {/* Collection name at top */}
          <div className="absolute top-4 md:top-6 left-0 right-0 text-center">
            <h3 className="text-base md:text-2xl font-light tracking-[0.15em] md:tracking-[0.2em] uppercase text-white/90">{getLoc(collection.name)}</h3>
          </div>

          {/* Countdown in center */}
          <div className="text-center">
            <div className="text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-3 text-orange-400">
              {notStartedYet
                ? (locale === 'pt' ? 'Começa em' : locale === 'es' ? 'Comienza en' : 'Starts in')
                : (locale === 'pt' ? 'Termina em' : locale === 'es' ? 'Termina en' : 'Ends in')
              }
            </div>
            <div className="scale-125 md:scale-[1.75]">
              <CountdownBadge
                endsAt={collection.ends_at}
                startsAt={collection.starts_at}
                variant="badge"
                locale={locale}
              />
            </div>
          </div>

          {/* Hint at bottom - different text for mobile */}
          <div className="absolute bottom-4 md:bottom-6 left-0 right-0 text-center">
            <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-white/50">
              <span className="md:hidden">{locale === 'pt' ? 'Toque para ver' : locale === 'es' ? 'Toca para ver' : 'Tap to reveal'}</span>
              <span className="hidden md:inline">{locale === 'pt' ? 'Passe o mouse para ver' : locale === 'es' ? 'Pasa el mouse para ver' : 'Hover to reveal'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Overlay message for unavailable collections */}
      {!isAvailable && !isExpired && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white text-sm font-bold uppercase tracking-widest">{COMING_SOON_TEXT[locale]}</span>
        </div>
      )}
    </div>
  );
};

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
  onGenderChange
}) => {
  // Cart context for incentive bar
  const { cartItems, subtotal } = useCartContext();
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [internalGender, setInternalGender] = useState<Gender>(Gender.FEMALE);

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
    const mainContainer = document.getElementById('main-content');
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
  } = useProductFilters({
    products: categoryFilteredProducts,
    activeCategory,
    userMode
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedSizes, selectedColors, priceMin, priceMax, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const currentProducts = useMemo(() => {
    return filteredAndSortedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [currentPage, filteredAndSortedProducts]);

  // Count active filters for badge
  const activeFilterCount = selectedSizes.length + selectedColors.length + (priceMin !== null || priceMax !== null ? 1 : 0);

  // Find most urgent limited collection (has ends_at or starts_at, not expired)
  const urgentCollection = useMemo(() => {
    const now = new Date().getTime();
    return collections
      .filter(c => {
        // Must have at least ends_at to be a limited collection
        if (!c.ends_at && !c.starts_at) return false;
        // Check if expired
        if (c.ends_at) {
          const endTime = new Date(c.ends_at).getTime();
          if (endTime <= now) return false; // Already expired
        }
        return true;
      })
      .sort((a, b) => {
        // Prioritize collections that already started and are ending soon
        const aEnd = a.ends_at ? new Date(a.ends_at).getTime() : Infinity;
        const bEnd = b.ends_at ? new Date(b.ends_at).getTime() : Infinity;
        return aEnd - bEnd;
      })[0] || null;
  }, [collections]);


  return (
    <section id="collection" className="w-full bg-white flex flex-col pt-4 md:pt-20 pb-4">

      {/* Cart Incentive Banner - Feminine mobile, premium desktop */}
      {itemCount > 0 && onGoToCart && (
        <div
          onClick={onGoToCart}
          className="cursor-pointer mx-4 md:mx-12 mb-4 md:mb-6 group"
        >
          {/* Mobile: Elegant feminine bar */}
          <div className="md:hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-stone-100 to-rose-50 border border-stone-200/60 px-4 py-3 rounded-full shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-stone-600" />
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-400 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                </div>
                <span className="text-stone-700 font-semibold text-sm">
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-full text-[10px] font-medium uppercase tracking-wider">
                {locale === 'pt' ? 'Finalizar' : locale === 'es' ? 'Finalizar' : 'Checkout'}
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Desktop: Premium design with gradient */}
          <div className="hidden md:block rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.01]">
            <div className="relative bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white px-8 py-6">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                    <div className="relative bg-white/10 p-3 rounded-full">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                      {itemCount}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">
                      {locale === 'pt' ? 'Seu carrinho' : locale === 'es' ? 'Tu carrito' : 'Your cart'}
                    </p>
                    <p className="text-2xl font-light tracking-tight">
                      <span className="font-bold">{itemCount}</span> {itemCount === 1 ? 'item' : 'itens'}
                      <span className="mx-2 text-white/30">•</span>
                      <span className="text-orange-400 font-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-bold group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                  <span className="text-xs uppercase tracking-[0.15em]">
                    {locale === 'pt' ? 'Finalizar' : locale === 'es' ? 'Finalizar' : 'Checkout'}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collections Section */}
      {collections.length > 0 && (
        <div className="mb-4">
          <div className="px-6 md:px-12 mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-light tracking-tight uppercase mb-2">{t('nav.collection')}</h2>
              <p className="text-[10px] text-neutral-400 tracking-[0.2em] uppercase font-bold">{t('grid.curated')}</p>
            </div>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-6 md:px-12 no-scrollbar">
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
        </div>
      )}

      {/* Anchor for Scrolling (Non-sticky) */}
      <div id="grid-anchor" className="w-full h-1" />

      {/* Filters Sticky Bar - Categories + Filter Toggle */}
      <div id="product-filters" className="sticky top-24 md:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 py-3 md:py-4 px-4 md:px-12 mb-6 md:mb-8 transition-all">
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

      {/* Main Content Area - Sidebar + Products */}
      <div className="">
        <div className="flex">
          {/* Sidebar - Unificado Mobile/Desktop */}
          <FilterSidebar
            isOpen={isFiltersOpen}
            onClose={() => setIsFiltersOpen(false)}
            availableSizes={availableSizes}
            selectedSizes={selectedSizes}
            sizeCounts={sizeCounts}
            toggleSize={toggleSize}
            availableColors={availableColors}
            selectedColors={selectedColors}
            toggleColor={toggleColor}
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

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between px-6 md:px-12">
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">
                {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'produto' : 'produtos'}
              </p>
              {hasActiveFilters && (
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
                isFiltersOpen
                  ? 'grid-cols-2 md:grid-cols-3'
                  : currentProducts.length <= 3
                    ? 'grid-cols-2 md:grid-cols-3'
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {!isLoading && currentProducts.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    userMode={userMode}
                    locale={locale}
                    coupons={coupons}
                    variant="grid"
                    showWishlist={true}
                    showQuickAdd={!!onAddToCart}
                    showDiscountBadge={true}
                    showColorSwatches={true}
                    isWishlisted={wishlistIds.includes(p.id)}
                    onToggleWishlist={onToggleWishlist}
                    onAddToCart={onAddToCart}
                    onQuickAdd={(product) => setQuickAddProduct(product)}
                    onClick={() => onSelectProduct(p)}
                  />
                ))}
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
