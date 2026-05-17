import React from 'react';
import { ShoppingBag, Eye } from 'lucide-react';
import { ChatProduct } from '../../api/ai-chat.api';
import { formatCurrency } from '../../utils/currency';
import { Locale } from '../../i18n';
import { getOptimizedImageUrl } from '../../utils/image';

interface ChatProductCardProps {
  product: ChatProduct;
  locale: Locale;
  onView: () => void;
  onAddToCart: () => void;
}

export const ChatProductCard: React.FC<ChatProductCardProps> = ({
  product,
  locale,
  onView,
  onAddToCart
}) => {
  const mainImage = product.images?.[0] || '';
  const mainVariant = product.variants?.[0];
  const price = mainVariant?.retail_price || product.price_from || 0;
  const hasStock = mainVariant ? mainVariant.stock > 0 : true;

  return (
    <div className="bg-paper rounded-2xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md transition-all animate-in slide-in-from-bottom-2 duration-300 min-w-[140px]">
      {/* Product Image */}
      <div
        className="relative aspect-[3/4] bg-neutral-50 cursor-pointer group"
        onClick={onView}
      >
        {mainImage ? (
          <img
            src={getOptimizedImageUrl(mainImage, 'thumbnail')}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <ShoppingBag className="w-12 h-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.highlight && (
            <span className="px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
              Destaque
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
          <span className="text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
            Ver Produto
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-800 line-clamp-2 mb-2 leading-tight">
          {product.name}
        </h4>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-neutral-900">
            {formatCurrency(price, locale)}
          </span>
          {mainVariant?.color && (
            <div
              className="w-4 h-4 rounded-full border border-neutral-200 flex-shrink-0"
              style={{ backgroundColor: mainVariant.color_hex }}
              title={mainVariant.color}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onView}
            className="w-full py-2 border border-neutral-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-all flex items-center justify-center gap-1"
          >
            <Eye className="w-2.5 h-2.5" />
            Ver
          </button>
          <button
            onClick={onAddToCart}
            disabled={!hasStock}
            className="w-full py-2 bg-neutral-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-2.5 h-2.5" />
            {hasStock ? 'Adicionar' : 'Esgotado'}
          </button>
        </div>
      </div>
    </div>
  );
};
