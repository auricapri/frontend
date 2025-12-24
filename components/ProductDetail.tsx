
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, UserMode, CartItem, Review, UserProfile, Coupon } from '../types';
import { 
  Plus, 
  Minus, 
  Heart, 
  Maximize2, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Star,
  Tag
} from 'lucide-react';
import { Locale } from '../i18n';
import ProductReviews from './ProductReviews';
import { formatCurrency } from '../utils/currency';

interface ProductDetailProps {
  product: Product;
  coupons?: Coupon[];
  userMode: UserMode;
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  t: (key: string) => any;
  locale: Locale;
  currentUser: UserProfile | null;
  onShowToast?: (message: string, type?: 'info' | 'error') => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product, 
  coupons = [],
  userMode, 
  onAddToCart, 
  isWishlisted, 
  onToggleWishlist, 
  t, 
  locale,
  currentUser,
  onShowToast
}) => {
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

  const variants = product.variants || [];
  const sizes = useMemo(() => Array.from(new Set(variants.map(v => v.size))), [variants]);
  const colors = useMemo(() => {
    const unique = new Map();
    variants.forEach(v => {
      if (!unique.has(v.color_hex)) unique.set(v.color_hex, v.color_name);
    });
    return Array.from(unique.entries()).map(([hex, name]) => ({ hex, name }));
  }, [variants]);

  const [selectedSize, setSelectedSize] = useState(sizes[0] || '');
  const [selectedColorHex, setSelectedColorHex] = useState(colors[0]?.hex || '');
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>('desc');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomImgIndex, setZoomImgIndex] = useState(0);
  const [mobileActiveIdx, setMobileActiveIdx] = useState(0);

  const mobileGalleryRef = useRef<HTMLDivElement>(null);

  const activeVariant = useMemo(() => {
    return variants.find(v => v.size === selectedSize && v.color_hex === selectedColorHex) || variants[0];
  }, [selectedSize, selectedColorHex, variants]);

  // Ensure quantity doesn't exceed stock when switching variants
  useEffect(() => {
    if (activeVariant && quantity > activeVariant.stock_quantity) {
      setQuantity(Math.max(1, activeVariant.stock_quantity));
    }
  }, [activeVariant, quantity]);

  // COMBINED IMAGES: Variant images first, then base images
  const displayImages = useMemo(() => {
    const vImgs = activeVariant?.variant_images || [];
    const bImgs = product.base_images || [];
    // Combine and remove duplicates
    const combined = Array.from(new Set([...vImgs, ...bImgs])).filter(img => !!img);
    return combined.length > 0 ? combined : ['https://via.placeholder.com/1200x1600?text=No+Image'];
  }, [activeVariant, product]);

  // Reset/sync scroll when variant changes
  useEffect(() => {
    if (mobileGalleryRef.current) {
      mobileGalleryRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeVariant?.id]);

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const newIdx = Math.round(scrollLeft / width);
    if (newIdx !== mobileActiveIdx) setMobileActiveIdx(newIdx);
  };

  const rawPrice = activeVariant 
    ? (userMode === UserMode.RETAIL ? activeVariant.retail_price : activeVariant.wholesale_price)
    : 0;

  // Calculate Discount
  const activeCoupon = useMemo(() => coupons.find(c => c.product_ids?.includes(product.id)), [coupons, product.id]);
  const finalPrice = useMemo(() => {
      if (!activeCoupon) return rawPrice;
      if (activeCoupon.discount_type === 'percentage') return rawPrice * (1 - activeCoupon.discount_value / 100);
      return Math.max(0, rawPrice - activeCoupon.discount_value);
  }, [rawPrice, activeCoupon]);

  const handleAddToCart = () => {
    if (!activeVariant) return;
    
    if (quantity > activeVariant.stock_quantity) {
        if (onShowToast) {
            onShowToast(`Estoque insuficiente. Apenas ${activeVariant.stock_quantity} disponíveis.`, 'error');
        } else {
            alert(`Estoque insuficiente.`);
        }
        return;
    }

    onAddToCart({
      variant_id: activeVariant.id,
      product_id: product.id,
      name: product.name,
      image: displayImages[0],
      size: activeVariant.size || 'N/A',
      color_name: activeVariant.color_name,
      color_hex: activeVariant.color_hex || '#000',
      price: finalPrice, // Use discounted price if applicable
      quantity: quantity,
      sku: activeVariant.sku
    });
  };

  const incrementQuantity = () => {
      if (!activeVariant) return;
      if (quantity < activeVariant.stock_quantity) {
          setQuantity(quantity + 1);
      } else {
          if (onShowToast) {
              onShowToast("Limite de estoque atingido para este item.", 'info');
          }
      }
  };

  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
     setReviews([
       {
         id: 'r1',
         product_id: product.id,
         user_id: 'u1',
         user_name: 'Alessandra M.',
         rating: 5,
         comment: 'The quality of the material is exceptional. Truly luxury experience.',
         is_verified_purchase: true,
         created_at: new Date(Date.now() - 86400000 * 2).toISOString()
       }
     ]);
  }, [product.id]);

  return (
    <div className="relative w-full bg-white">
      <div className="flex flex-col md:flex-row w-full min-h-screen">
        
        {/* GALLERY COLUMN - 60% Width */}
        <div className="w-full md:w-[60%] bg-neutral-50 relative">
          
          {/* DESKTOP VIEW: Vertical Scroll Stack */}
          <div className="hidden md:flex flex-col space-y-4 p-4 lg:p-12 overflow-y-visible">
            {displayImages.map((img, idx) => (
              <div 
                key={idx} 
                className="relative aspect-[3/4] bg-white overflow-hidden cursor-zoom-in group rounded-[1.5rem] lg:rounded-[2.5rem] shadow-sm border border-neutral-100"
                onClick={() => { setZoomImgIndex(idx); setIsZoomOpen(true); }}
              >
                <img 
                  src={img} 
                  alt={`${getLoc(product.name)} view ${idx + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110" 
                  loading={idx === 0 ? "eager" : "lazy"}
                />
                <div className="absolute bottom-10 right-10 p-5 bg-white/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                  <Maximize2 className="w-6 h-6" />
                </div>
              </div>
            ))}
          </div>

          {/* MOBILE VIEW: Horizontal Swipe Carousel */}
          <div className="md:hidden relative group">
            <div 
              ref={mobileGalleryRef}
              onScroll={handleMobileScroll}
              className="aspect-[3/4] overflow-x-auto snap-x snap-mandatory flex no-scrollbar bg-white"
            >
              {displayImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className="flex-none w-full h-full snap-center relative overflow-hidden" 
                  onClick={() => { setZoomImgIndex(idx); setIsZoomOpen(true); }}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
            </div>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
               <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {mobileActiveIdx + 1} <span className="text-white/40">/ {displayImages.length}</span>
               </span>
            </div>
          </div>
        </div>

        {/* INFO COLUMN - 40% Width */}
        <div className="w-full md:w-[40%] p-8 md:p-16 lg:p-24 bg-white">
          <div className="md:sticky md:top-32 transition-all duration-700">
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6 animate-in fade-in duration-700">
                <div className="flex text-black">
                   {[...Array(5)].map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < 4 ? 'fill-current' : 'text-neutral-100'}`} />)}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">({reviews.length} reviews)</span>
              </div>
              
              <div className="flex items-center justify-between mb-6">
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-300 block">Collection Piece</span>
                 {activeCoupon && (
                    <div className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-full shadow-lg">
                        <Tag className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">{activeCoupon.code} APPLIED</span>
                    </div>
                 )}
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-light tracking-tighter uppercase leading-[0.85] mb-10 text-neutral-900">
                {getLoc(product.name)}
              </h1>
              
              <div className="flex flex-col">
                <div className="flex items-baseline space-x-6">
                    {activeCoupon && (
                        <span className="text-xl font-bold text-neutral-400 line-through decoration-red-400 decoration-2">{formatCurrency(rawPrice, locale)}</span>
                    )}
                    <span className={`text-3xl font-light tracking-tighter ${activeCoupon ? 'text-red-500' : 'text-black'}`}>{formatCurrency(finalPrice, locale)}</span>
                </div>
                {activeVariant?.stock_quantity <= 10 && activeVariant?.stock_quantity > 0 && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-red-500 mt-2 animate-pulse">
                        Últimas {activeVariant.stock_quantity} unidades
                    </span>
                )}
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300 mt-2">Complimentary Shipping</span>
              </div>
            </div>

            {/* SELECTION AREAS */}
            <div className="space-y-12 mb-16">
              {colors.length > 0 && (
                <div className="space-y-5">
                  <label className="text-[9px] uppercase font-black tracking-[0.3em] text-neutral-400">Palette — {getLoc(activeVariant?.color_name)}</label>
                  <div className="flex flex-wrap gap-4">
                    {colors.map(c => (
                      <button 
                        key={c.hex} 
                        onClick={() => setSelectedColorHex(c.hex)}
                        className={`w-12 h-12 rounded-full border-2 p-1 transition-all duration-500 ${selectedColorHex === c.hex ? 'border-black scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <div className="w-full h-full rounded-full shadow-inner border border-neutral-100" style={{ backgroundColor: c.hex }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div className="space-y-5">
                  <label className="text-[9px] uppercase font-black tracking-[0.3em] text-neutral-400">Measurement</label>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map(s => (
                      <button 
                        key={s} 
                        onClick={() => setSelectedSize(s || '')}
                        className={`min-w-[70px] px-6 py-4 text-[11px] font-black border transition-all duration-500 rounded-xl uppercase tracking-widest ${selectedSize === s ? 'bg-black text-white border-black shadow-xl scale-105' : 'bg-white text-neutral-400 border-neutral-100 hover:border-black hover:text-black'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col gap-6 mb-16">
               <div className="flex items-stretch gap-3 h-20">
                  <div className="flex flex-none items-center bg-neutral-50 rounded-2xl border border-neutral-100 px-4 space-x-6">
                     <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:opacity-50 transition-opacity"><Minus className="w-3 h-3" /></button>
                     <span className="text-sm font-black w-4 text-center">{quantity}</span>
                     <button 
                        onClick={incrementQuantity} 
                        className={`p-2 transition-opacity ${quantity >= (activeVariant?.stock_quantity || 0) ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-50'}`}
                        disabled={quantity >= (activeVariant?.stock_quantity || 0)}
                     >
                        <Plus className="w-3 h-3" />
                     </button>
                  </div>
                  
                  <button 
                    onClick={handleAddToCart}
                    disabled={!activeVariant || activeVariant.stock_quantity === 0}
                    className="flex-1 bg-black text-white rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center text-center px-4"
                  >
                    {activeVariant?.stock_quantity === 0 ? t('product.outOfStock') : t('product.addToCart')}
                  </button>

                  <button 
                    onClick={onToggleWishlist}
                    className={`flex-none aspect-square border rounded-2xl flex items-center justify-center transition-all duration-500 ${isWishlisted ? 'bg-black text-white border-black shadow-lg scale-105' : 'border-neutral-100 text-neutral-300 hover:text-black hover:border-black hover:bg-neutral-50'}`}
                  >
                    <Heart 
                      className="w-5 h-5 transition-transform active:scale-125" 
                      fill={isWishlisted ? "currentColor" : "none"}
                    />
                  </button>
               </div>
            </div>

            {/* ACCORDIONS */}
            <div className="border-t border-neutral-100 pt-8 space-y-2">
               {[
                 { id: 'desc', label: t('product.description'), content: getLoc(product.description) },
                 { id: 'comp', label: t('product.composition'), content: 'Sustainable luxury materials. Hand-finished in our atelier.' }
               ].map(section => (
                 <div key={section.id} className="border-b border-neutral-50 last:border-0">
                    <button 
                      onClick={() => setOpenSection(openSection === section.id ? null : section.id)} 
                      className="w-full flex justify-between items-center py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-60 transition-opacity"
                    >
                      {section.label}
                      {openSection === section.id ? <Minus className="w-3 h-3 text-neutral-400" /> : <Plus className="w-3 h-3 text-neutral-400" />}
                    </button>
                    <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${openSection === section.id ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                       <p className="text-[11px] leading-relaxed text-neutral-500 font-medium max-w-sm">{section.content}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div id="reviews" className="w-full bg-white border-t border-neutral-100 pt-32 pb-40 px-8 md:px-24">
        <div className="max-w-7xl mx-auto">
          <ProductReviews 
            productId={product.id} 
            reviews={reviews} 
            user={currentUser} 
            t={t} 
            onAddReview={async (r) => { 
               const newReview: Review = { ...r, id: `rev_${Date.now()}`, created_at: new Date().toISOString() } as Review;
               setReviews(prev => [newReview, ...prev]);
            }}
          />
        </div>
      </div>

      {/* ZOOM MODAL */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-700">
           <header className="h-24 px-12 flex justify-between items-center fixed top-0 w-full z-10 bg-white/90 backdrop-blur-3xl">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-neutral-300">Gallery View</span>
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em]">{getLoc(product.name)}</h4>
              </div>
              <button onClick={() => setIsZoomOpen(false)} className="p-4 bg-black text-white rounded-full hover:rotate-90 transition-all duration-500 shadow-2xl">
                <X className="w-6 h-6" />
              </button>
           </header>
           
           <div className="flex-1 overflow-hidden p-8 md:p-24 flex items-center justify-center relative bg-neutral-50/30">
              <button 
                disabled={zoomImgIndex === 0} 
                onClick={() => setZoomImgIndex(prev => prev - 1)} 
                className="absolute left-6 md:left-12 p-6 bg-white/80 backdrop-blur-md rounded-full shadow-2xl disabled:opacity-0 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <img 
                  src={displayImages[zoomImgIndex]} 
                  className="max-h-full max-w-full object-contain cursor-crosshair transition-transform duration-700 hover:scale-150" 
                  alt=""
                />
              </div>
              
              <button 
                disabled={zoomImgIndex === displayImages.length - 1} 
                onClick={() => setZoomImgIndex(prev => prev + 1)} 
                className="absolute right-6 md:right-12 p-6 bg-white/80 backdrop-blur-md rounded-full shadow-2xl disabled:opacity-0 transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
           </div>
           
           <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-white/50 backdrop-blur-xl rounded-[2rem] border border-white/20">
              {displayImages.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setZoomImgIndex(i)}
                  className={`w-12 h-16 rounded-xl overflow-hidden border-2 transition-all ${zoomImgIndex === i ? 'border-black scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
