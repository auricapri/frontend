import React from 'react';
import { X, Heart } from 'lucide-react';
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
    zIndex: 50,
  };

  // Garantir distância mínima do topo (para não sobrepor o header)
  const minTopOffset = 12; // Mínimo 12% do topo

  // Position popup based on hotspot location
  if (position.x > 60) {
    popupStyle.right = `${100 - position.x + 3}%`;
    popupStyle.left = 'auto';
  } else if (position.x < 40) {
    popupStyle.left = `${position.x + 3}%`;
    popupStyle.right = 'auto';
  } else {
    // Centro horizontal - posicionar no centro
    popupStyle.left = '50%';
    popupStyle.transform = 'translateX(-50%)';
  }

  if (position.y > 60) {
    popupStyle.bottom = `${100 - position.y + 3}%`;
    popupStyle.top = 'auto';
  } else {
    popupStyle.top = `${Math.max(position.y + 3, minTopOffset)}%`;
    popupStyle.bottom = 'auto';
  }

  // Show loading/error state if relations are missing
  const isMissingData = !linked_variant || !linked_product;

  if (isMissingData) {
    return (
      <div
        style={popupStyle}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden w-64 max-w-[calc(100vw-2rem)] animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4">
          <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="aspect-[4/3] bg-neutral-100 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-3 w-20 bg-neutral-200 rounded animate-pulse" />
          <div className="h-5 w-16 bg-neutral-200 rounded animate-pulse" />
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

  const inStock = linked_variant.stock_quantity > 0;

  return (
    <div
      style={popupStyle}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden w-64 max-w-[calc(100vw-2rem)] animate-in zoom-in-95 fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header: Product name + close button */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100">
        <h3 className="text-sm font-bold text-neutral-900 line-clamp-1 pr-2">
          {getLocText(linked_product.name)}
        </h3>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-neutral-100 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Product Image - clickable */}
      {imageUrl && (
        <div
          onClick={handleNavigate}
          className="cursor-pointer"
        >
          <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden">
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
        {/* Inclusion status (from hotspot label) */}
        {hotspot.label && (
          <p className="text-sm text-neutral-500">
            {getLocText(hotspot.label)}
          </p>
        )}

        {/* Price */}
        <p className="text-lg font-bold text-neutral-900">
          {formatCurrency(linked_variant.retail_price, locale)}
        </p>

        {/* Stock status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">
            {inStock ? 'Em estoque' : 'Indisponível'}
          </span>
          {inStock ? (
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded uppercase tracking-wider">
              EM ESTOQUE
            </span>
          ) : (
            <span className="text-[9px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded uppercase tracking-wider">
              ESGOTADO
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onAddToCart}
            disabled={!inStock}
            className="flex-1 py-3 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ADICIONAR EXTRA
          </button>
          <button
            onClick={handleNavigate}
            className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all"
            title="Ver produto"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
