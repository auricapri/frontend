import React from 'react';
import { X, ShoppingBag, ExternalLink } from 'lucide-react';
import { ProductImageHotspot, LocalizedText, Product } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Locale } from '../../i18n';

interface HotspotPopupProps {
  hotspot: ProductImageHotspot;
  locale: Locale;
  onClose: () => void;
  onAddToCart: () => void;
  onNavigateToProduct?: (product: Product) => void;
  position: { x: number; y: number };
}

/**
 * Popup that appears when clicking a hotspot
 * Shows product info and add to cart button
 */
export function HotspotPopup({
  hotspot,
  locale,
  onClose,
  onAddToCart,
  onNavigateToProduct,
  position
}: HotspotPopupProps) {
  const { linked_variant, linked_product } = hotspot;

  // Helper to get localized text
  const getLocText = (text: LocalizedText | string | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[locale] || text.en || text.pt || Object.values(text)[0] || '';
  };

  // Calculate popup position (avoid going off screen)
  const popupStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 50
  };

  // Position popup based on hotspot location
  if (position.x > 50) {
    popupStyle.right = `${100 - position.x + 5}%`;
    popupStyle.left = 'auto';
  } else {
    popupStyle.left = `${position.x + 5}%`;
    popupStyle.right = 'auto';
  }

  if (position.y > 50) {
    popupStyle.bottom = `${100 - position.y + 5}%`;
    popupStyle.top = 'auto';
  } else {
    popupStyle.top = `${position.y + 5}%`;
    popupStyle.bottom = 'auto';
  }

  // Show loading/error state if relations are missing
  const isMissingData = !linked_variant || !linked_product;

  if (isMissingData) {
    return (
      <div
        style={popupStyle}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden w-56 animate-in zoom-in-95 fade-in duration-200 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1 bg-white/90 hover:bg-white rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
            <ShoppingBag className="w-5 h-5 text-neutral-400" />
          </div>
          <p className="text-xs text-neutral-500">
            Carregando produto...
          </p>
        </div>
      </div>
    );
  }

  // Get image
  const imageUrl = linked_variant?.variant_images?.[0] || linked_product?.base_images?.[0];

  const handleNavigate = () => {
    if (onNavigateToProduct && linked_product) {
      onNavigateToProduct(linked_product);
    }
  };

  return (
    <div
      style={popupStyle}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden w-64 animate-in zoom-in-95 fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Related product label */}
      <div className="bg-neutral-100 px-3 py-1.5 flex items-center justify-between">
        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
          Produto relacionado
        </span>
        {/* Close button */}
        <button
          onClick={onClose}
          className="p-0.5 hover:bg-neutral-200 rounded-full transition-all"
        >
          <X className="w-3.5 h-3.5 text-neutral-500" />
        </button>
      </div>

      {/* Product Image */}
      {imageUrl && (
        <div
          onClick={handleNavigate}
          className="block cursor-pointer"
        >
          <div className="aspect-square bg-neutral-100 relative overflow-hidden">
            <img
              src={imageUrl}
              alt={getLocText(linked_product.name)}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      )}

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div
          onClick={handleNavigate}
          className="block hover:opacity-70 transition-opacity cursor-pointer"
        >
          <h4 className="text-sm font-bold leading-tight line-clamp-2">
            {getLocText(linked_product.name)}
          </h4>
          {(linked_variant.color_name || linked_variant.size) && (
            <p className="text-[10px] text-neutral-500 mt-1">
              {getLocText(linked_variant.color_name)}
              {linked_variant.color_name && linked_variant.size && ' - '}
              {linked_variant.size}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-black">
            {formatCurrency(linked_variant.retail_price, locale)}
          </span>

          {/* Stock indicator */}
          {linked_variant.stock_quantity > 0 ? (
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">
              Em estoque
            </span>
          ) : (
            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase tracking-widest">
              Esgotado
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleNavigate}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Ver produto
          </button>
          <button
            onClick={onAddToCart}
            disabled={linked_variant.stock_quantity <= 0}
            title="Adicionar ao carrinho"
            className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
