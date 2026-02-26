import React from 'react';
import { Product, UserMode, Coupon, LocalizedText } from '../../types';
import { Locale } from '../../i18n';
import { ProductCard } from './ProductCard';

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

  return (
    <div className="w-full bg-white border-t border-neutral-100 pt-16 md:pt-24 pb-32 md:pb-32">
      <div className="w-full">
        <div className="mb-8 md:mb-12 px-6 md:px-12">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight uppercase mb-2">{t('product.related')}</h2>
          <p className="text-[10px] text-neutral-400 tracking-[0.2em] uppercase font-bold">{t('product.relatedSubtitle')}</p>
        </div>

        {/* Mobile: Horizontal Scroll Carousel */}
        <div className="md:hidden overflow-x-auto overflow-y-hidden no-scrollbar px-4">
          <div className="flex gap-3 flex-nowrap" style={{ width: `${products.length * 180 + (products.length - 1) * 12}px` }}>
            {products.map((p) => (
              <div key={p.id} className="flex-none w-[180px]">
                <ProductCard
                  product={p}
                  userMode={userMode}
                  locale={locale}
                  coupons={coupons}
                  variant="grid"
                  showWishlist={true}
                  showQuickAdd={false}
                  showDiscountBadge={true}
                  showColorSwatches={true}
                  isWishlisted={wishlistIds.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  onClick={() => onSelectProduct?.(p)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid grid-cols-4 px-6 md:px-12">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              userMode={userMode}
              locale={locale}
              coupons={coupons}
              variant="grid"
              showWishlist={true}
              showQuickAdd={false}
              showDiscountBadge={true}
              showColorSwatches={true}
              isWishlisted={wishlistIds.includes(p.id)}
              onToggleWishlist={onToggleWishlist}
              onClick={() => onSelectProduct?.(p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
