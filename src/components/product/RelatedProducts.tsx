import React from 'react';
import { Product, UserMode, Coupon, LocalizedText } from '../../types';
import { Heart, Tag, Truck } from 'lucide-react';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { calculatePrice } from '../../utils/product';
import { getDisplayPrice as getProductDisplayPrice } from '../../utils/coupon';
import { OptimizedImage } from '../ui';

interface RelatedProductsProps {
  products: Product[];
  userMode: UserMode;
  locale: Locale;
  coupons: Coupon[];
  wishlistIds: string[];
  onSelectProduct?: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  getLoc: (text: LocalizedText | string | undefined) => string;
  t: (key: string) => string;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  products,
  userMode,
  locale,
  coupons,
  wishlistIds,
  onSelectProduct,
  onToggleWishlist,
  getLoc,
  t,
}) => {
  if (products.length === 0) return null;

  // Use shared coupon utility for related product pricing
  const getRelatedDisplayPrice = (p: Product, originalPrice: number) =>
    getProductDisplayPrice(originalPrice, p.id, coupons);

  return (
    <div className="w-full bg-white border-t border-neutral-100 pt-32 pb-40">
      <div className="w-full">
        <div className="mb-16 px-8 md:px-24">
          <h2 className="text-3xl font-light tracking-tight uppercase mb-2">{t('product.related')}</h2>
          <p className="text-[10px] text-neutral-400 tracking-[0.2em] uppercase font-bold">{t('product.relatedSubtitle')}</p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:flex w-full">
          {products.map((p) => {
            const mainVariant = p.variants?.[0];
            const rawPrice = mainVariant ? calculatePrice(mainVariant, userMode) : 0;
            const { original, final, hasDiscount, code } = getRelatedDisplayPrice(p, rawPrice);
            const displayImg = p.default_image_url || p.base_images[0];
            const isWishlistedProduct = wishlistIds.includes(p.id);

            return (
              <div
                key={p.id}
                onClick={() => onSelectProduct?.(p)}
                className="flex-1 cursor-pointer group relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                <div className="relative w-full h-[500px] overflow-hidden bg-neutral-50">
                  <OptimizedImage
                    src={displayImg}
                    alt={getLoc(p.name)}
                    className="w-full h-full transition-transform duration-1000 group-hover:scale-110"
                    size="medium"
                    objectFit="cover"
                  />

                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {hasDiscount && (
                      <div className="bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                        <Tag className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">{code}</span>
                      </div>
                    )}
                    {p.has_free_shipping && (
                      <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                        <Truck className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Frete Gratis</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist?.(p.id);
                    }}
                    className={`absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all transform hover:scale-110 active:scale-90 ${isWishlistedProduct ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-900'}`}
                  >
                    <Heart className="w-4 h-4" fill={isWishlistedProduct ? "currentColor" : "none"} />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6">
                    <div className="flex flex-col">
                      <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2 leading-tight line-clamp-2">{getLoc(p.name)}</h3>
                      <div className="flex flex-col items-start">
                        {hasDiscount && (
                          <span className="text-xs font-bold text-white/60 line-through decoration-white/40 mb-0.5">{formatCurrency(original, locale)}</span>
                        )}
                        <span className={`text-base font-black tracking-tighter ${hasDiscount ? 'text-red-400' : 'text-white'}`}>
                          {formatCurrency(final, locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden overflow-x-auto no-scrollbar">
          <div className="flex" style={{ width: `${products.length * 280}px` }}>
            {products.map((p) => {
              const mainVariant = p.variants?.[0];
              const rawPrice = mainVariant ? calculatePrice(mainVariant, userMode) : 0;
              const { original, final, hasDiscount, code } = getRelatedDisplayPrice(p, rawPrice);
              const displayImg = p.default_image_url || p.base_images[0];
              const isWishlistedProduct = wishlistIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProduct?.(p)}
                  className="flex-none w-[280px] cursor-pointer group relative overflow-hidden"
                >
                  <div className="relative w-full h-[350px] overflow-hidden bg-neutral-50">
                    <OptimizedImage
                      src={displayImg}
                      alt={getLoc(p.name)}
                      className="w-full h-full transition-transform duration-1000 group-hover:scale-110"
                      size="medium"
                      objectFit="cover"
                    />

                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      {hasDiscount && (
                        <div className="bg-black text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                          <Tag className="w-2.5 h-2.5" />
                          <span className="text-[7px] font-black uppercase tracking-widest">{code}</span>
                        </div>
                      )}
                      {p.has_free_shipping && (
                        <div className="bg-emerald-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                          <Truck className="w-2.5 h-2.5" />
                          <span className="text-[7px] font-black uppercase tracking-widest">Frete Gratis</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist?.(p.id);
                      }}
                      className={`absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all transform hover:scale-110 active:scale-90 ${isWishlistedProduct ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-900'}`}
                    >
                      <Heart className="w-3.5 h-3.5" fill={isWishlistedProduct ? "currentColor" : "none"} />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4">
                      <div className="flex flex-col">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white mb-1 leading-tight line-clamp-2">{getLoc(p.name)}</h3>
                        <div className="flex flex-col items-start">
                          {hasDiscount && (
                            <span className="text-[9px] font-bold text-white/60 line-through decoration-white/40 mb-0.5">{formatCurrency(original, locale)}</span>
                          )}
                          <span className={`text-sm font-black tracking-tighter ${hasDiscount ? 'text-red-400' : 'text-white'}`}>
                            {formatCurrency(final, locale)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
