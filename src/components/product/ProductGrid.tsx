
import React, { useState, useMemo } from 'react';
import { Product, UserMode, Category, Collection, Coupon } from '../../types';
import { Heart, SlidersHorizontal, ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { calculatePrice, filterProductsForMode } from '../../utils/product';

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
  t: (key: string) => string;
  locale: Locale;
  isLoading?: boolean;
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
  t, 
  locale,
  isLoading
}) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const getLoc = (obj: any): string => {
    if (obj === null || obj === undefined) return "";
    if (typeof obj === 'string') {
      if (obj.trim().startsWith('{')) {
        try { return getLoc(JSON.parse(obj)); } catch { return obj; }
      }
      return obj;
    }
    if (typeof obj === 'object') {
      const val = obj[locale] || obj['pt'] || obj['en'] || obj['es'] || obj['fr'];
      if (typeof val === 'string') return val;
      const first = Object.values(obj).find(v => typeof v === 'string');
      return (first as string) || "";
    }
    return String(obj);
  };

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

  const filteredProducts = useMemo(() => {
    // First filter by mode (atacado filters variants with stock < 10)
    const modeFiltered = filterProductsForMode(products, userMode);
    
    const productsInLocale = modeFiltered.filter(p => {
      const name = getLoc(p.name);
      return name && name.trim() !== '';
    });

    if (activeCategory === "All") return productsInLocale;
    
    const cat = categories.find(c => getLoc(c.name) === activeCategory);
    return productsInLocale.filter(p => p.category_id === cat?.id);
  }, [activeCategory, products, categories, locale, userMode]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentProducts = useMemo(() => filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [currentPage, filteredProducts]);

  // Helper to calculate discounted price
  const getDisplayPrice = (product: Product, originalPrice: number) => {
    const activeCoupon = coupons.find(c => c.product_ids?.includes(product.id));
    if (!activeCoupon) return { original: originalPrice, final: originalPrice, hasDiscount: false };

    let final = originalPrice;
    if (activeCoupon.discount_type === 'percentage') {
        final = originalPrice * (1 - activeCoupon.discount_value / 100);
    } else {
        final = Math.max(0, originalPrice - activeCoupon.discount_value);
    }
    return { original: originalPrice, final, hasDiscount: true, code: activeCoupon.code };
  };

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

      {/* Filters Sticky Bar */}
      <div id="product-filters" className="sticky top-16 md:top-20 z-30 bg-white/95 backdrop-blur-md border-y border-neutral-100 py-6 px-6 md:px-12 mb-16 transition-all">
         <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
           <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3 text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>{t('grid.filter')}</span>
              </div>
           </div>
           <div className="flex overflow-x-auto no-scrollbar space-x-2 pb-2 md:pb-0">
               <button 
                 onClick={() => handleFilterClick("All")} 
                 className={`px-8 py-3 rounded-xl text-[10px] uppercase tracking-widest font-bold border transition-all ${activeCategory === "All" ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-400 border-neutral-100 hover:border-neutral-900'}`}
               >
                 All Items
               </button>
               {categories.map(cat => (
                 <button 
                   key={cat.id} 
                   onClick={() => handleFilterClick(getLoc(cat.name))} 
                   className={`px-8 py-3 rounded-xl text-[10px] uppercase tracking-widest font-bold border transition-all ${activeCategory === getLoc(cat.name) ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-400 border-neutral-100 hover:border-neutral-900'}`}
                 >
                   {getLoc(cat.name)}
                 </button>
               ))}
           </div>
         </div>
      </div>

      {/* Product Grid */}
      <div className="px-6 md:px-12">
        {currentProducts.length === 0 && !isLoading ? (
           <div className="py-20 text-center flex flex-col items-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">{t('grid.noItems')}</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-24">
            {!isLoading && currentProducts.map(p => {
                 const mainVariant = p.variants?.[0];
                 const rawPrice = mainVariant ? calculatePrice(mainVariant, userMode) : 0;
                 const { original, final, hasDiscount, code } = getDisplayPrice(p, rawPrice);
                 const displayImg = p.default_image_url || p.base_images[0];
                 const isWishlisted = wishlistIds.includes(p.id);
                 return (
                  <div key={p.id} onClick={() => onSelectProduct(p)} className="cursor-pointer group flex flex-col relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50 mb-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-neutral-100">
                      <img src={displayImg} alt={getLoc(p.name)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      
                      {hasDiscount && (
                          <div className="absolute top-4 left-4 bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg z-10">
                              <Tag className="w-3 h-3" />
                              <span className="text-[8px] font-black uppercase tracking-widest">{code}</span>
                          </div>
                      )}

                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleWishlist(p.id); }} 
                        className={`absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all transform hover:scale-110 active:scale-90 ${isWishlisted ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-900'}`}
                      >
                        <Heart className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-900 mb-1 leading-tight">{getLoc(p.name)}</h3>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{getLoc(categories.find(c => c.id === p.category_id)?.name)}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        {hasDiscount && (
                            <span className="text-[10px] font-bold text-neutral-400 line-through decoration-red-400 mb-0.5">{formatCurrency(original, locale)}</span>
                        )}
                        <span className={`text-[11px] font-black tracking-tighter ${hasDiscount ? 'text-red-500' : 'text-neutral-900'}`}>
                            {formatCurrency(final, locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-12 mt-40">
            <button 
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1} 
              className="p-4 border border-neutral-100 rounded-full hover:bg-neutral-900 hover:text-white disabled:opacity-20 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('grid.page')}</span>
              <span className="text-xl font-light">{currentPage} <span className="text-neutral-300 text-sm">/ {totalPages}</span></span>
            </div>
            <button 
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
              disabled={currentPage === totalPages} 
              className="p-4 border border-neutral-100 rounded-full hover:bg-neutral-900 hover:text-white disabled:opacity-20 transition-all shadow-sm"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;