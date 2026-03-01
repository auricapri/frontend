import React from 'react';
import { Star, Truck } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { type Coupon, type Product } from '../../../types';
import { type Locale } from '../../../i18n';

export function ProductInfo(props: {
  product: Product;
  locale: Locale;
  t: (key: string) => any;
  getLoc: (obj: any) => string;
  reviewsCount: number;
  rawPrice: number;
  finalPrice: number;
  activeCoupon: Coupon | null;
  stockQuantity?: number;
}) {
  const { product, locale, t: _t, getLoc, reviewsCount, rawPrice, finalPrice, activeCoupon, stockQuantity } = props;

  return (
    <div className="mb-6 pt-2 md:pt-0">
      {reviewsCount > 0 && (
        <div className="flex items-center gap-3 mb-4 animate-in fade-in duration-700">
          <div className="flex text-black">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < 4 ? 'fill-current' : 'text-neutral-100'}`} />
            ))}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">({reviewsCount} avaliações)</span>
        </div>
      )}

      {product.has_free_shipping && (
        <div className="flex items-center gap-1.5 mb-4 bg-emerald-500 text-white px-2.5 py-1 rounded-full w-fit">
          <Truck className="w-2.5 h-2.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Frete Grátis</span>
        </div>
      )}

      <h1 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-tighter uppercase leading-[0.95] mb-6 text-neutral-900 line-clamp-2">
        {getLoc(product.name)}
      </h1>

      <div className="flex flex-col mb-6">
        <div className="flex items-baseline space-x-4">
          {activeCoupon && <span className="text-lg font-bold text-neutral-400 line-through decoration-red-400 decoration-2">{formatCurrency(rawPrice, locale)}</span>}
          <span className={`text-2xl font-light tracking-tighter ${activeCoupon ? 'text-red-500' : 'text-black'}`}>{formatCurrency(finalPrice, locale)}</span>
        </div>
        {finalPrice > 0 && (
          <span className="text-xs text-neutral-500 mt-1">
            ou <span className="font-bold text-black">6x de {formatCurrency(finalPrice / 6, locale)}</span> sem juros
          </span>
        )}
        {typeof stockQuantity === 'number' && stockQuantity <= 10 && stockQuantity > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-2 animate-pulse">Últimas {stockQuantity} unidades</span>
        )}
      </div>
    </div>
  );
}

