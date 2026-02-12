import React from 'react';
import { ChevronRight } from 'lucide-react';
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
 * Compact popup that appears when clicking a hotspot
 * Small and basic - matches flutter_app design
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

  // Determine if popup should appear on left or right of hotspot
  const showOnLeft = position.x > 50;

  // Calculate popup position
  const popupStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 50,
    top: `${position.y}%`,
    transform: 'translateY(-50%)',
  };

  if (showOnLeft) {
    popupStyle.right = `${100 - position.x + 3}%`;
  } else {
    popupStyle.left = `${position.x + 3}%`;
  }

  // Show loading state if relations are missing
  const isMissingData = !linked_variant || !linked_product;

  if (isMissingData) {
    return (
      <div
        style={popupStyle}
        className="bg-white rounded-lg shadow-xl px-3 py-2 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-neutral-100 rounded animate-pulse" />
          <div className="space-y-1">
            <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse" />
            <div className="h-3 w-12 bg-neutral-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Get image
  const imageUrl = linked_variant?.variant_images?.[0] || linked_product?.base_images?.[0];

  const handleClick = () => {
    if (onNavigateToProduct && linked_product) {
      onNavigateToProduct(linked_product);
    }
  };

  return (
    <div
      style={popupStyle}
      className="bg-white rounded-lg shadow-xl px-3 py-2 cursor-pointer hover:shadow-2xl transition-shadow animate-in zoom-in-95 fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
    >
      <div className="flex items-center gap-2">
        {/* Thumbnail */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={getLocText(linked_product.name)}
            className="w-9 h-9 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 bg-neutral-100 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-neutral-400 text-xs">•</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-900 truncate max-w-[100px]">
            {getLocText(hotspot.label) || getLocText(linked_product.name)}
          </p>
          <p className="text-[11px] font-semibold text-neutral-600">
            {formatCurrency(linked_variant.retail_price, locale)}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-3 h-3 text-neutral-400 flex-shrink-0" />
      </div>
    </div>
  );
}
