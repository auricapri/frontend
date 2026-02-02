import React, { useState, useCallback } from 'react';
import { ProductImageHotspot, CartItem, LocalizedText, Product } from '../../types';
import { HotspotDot } from './HotspotDot';
import { HotspotPopup } from './HotspotPopup';
import { Locale } from '../../i18n';

interface ImageHotspotsProps {
  imageUrl: string;
  hotspots: ProductImageHotspot[];
  locale: Locale;
  onAddToCart: (item: CartItem) => void;
  onNavigateToProduct?: (product: Product) => void;
  children: React.ReactNode;
}

/**
 * Wrapper component that renders hotspots over an image
 * Children should be the actual image component
 */
export function ImageHotspots({
  imageUrl,
  hotspots,
  locale,
  onAddToCart,
  onNavigateToProduct,
  children
}: ImageHotspotsProps) {
  const [activeHotspot, setActiveHotspot] = useState<ProductImageHotspot | null>(null);

  // Helper to get localized text
  const getLocText = (text: LocalizedText | string | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[locale] || text.en || text.pt || Object.values(text)[0] || '';
  };

  // Filter hotspots for this specific image
  const imageHotspots = hotspots.filter(h => h.image_url === imageUrl && h.is_active);

  const handleAddToCart = useCallback(() => {
    if (!activeHotspot?.linked_variant || !activeHotspot?.linked_product) return;

    const variant = activeHotspot.linked_variant;
    const product = activeHotspot.linked_product;

    const cartItem: CartItem = {
      variant_id: variant.id,
      product_id: product.id,
      name: product.name,
      image: variant.variant_images?.[0] || product.base_images?.[0] || '',
      size: variant.size || '',
      color_name: variant.color_name,
      color_hex: variant.color_hex || '',
      price: variant.retail_price,
      quantity: 1,
      sku: variant.sku
    };

    onAddToCart(cartItem);
    setActiveHotspot(null);
  }, [activeHotspot, onAddToCart]);

  // If no hotspots, just render children
  if (imageHotspots.length === 0) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onClick={() => setActiveHotspot(null)}
    >
      {/* The image */}
      {children}

      {/* Render hotspot dots with labels */}
      {imageHotspots.map(hotspot => (
        <HotspotDot
          key={hotspot.id}
          x={hotspot.x_percent}
          y={hotspot.y_percent}
          isActive={activeHotspot?.id === hotspot.id}
          productName={getLocText(hotspot.linked_product?.name)}
          label={getLocText(hotspot.label)}
          onClick={() => setActiveHotspot(
            activeHotspot?.id === hotspot.id ? null : hotspot
          )}
        />
      ))}

      {/* Active hotspot popup */}
      {activeHotspot && (
        <HotspotPopup
          hotspot={activeHotspot}
          locale={locale}
          onClose={() => setActiveHotspot(null)}
          onAddToCart={handleAddToCart}
          onNavigateToProduct={onNavigateToProduct}
          position={{
            x: activeHotspot.x_percent,
            y: activeHotspot.y_percent
          }}
        />
      )}
    </div>
  );
}
