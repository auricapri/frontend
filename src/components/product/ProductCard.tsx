import React, { useCallback, useState } from 'react';
import { Product, UserMode, Coupon } from '../../types';
import { Heart, ShoppingBag, Truck } from 'lucide-react';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { calculatePrice } from '../../utils/product';
import { createGetLoc } from '../../utils/localization';
import { getDisplayPrice as getProductDisplayPrice } from '../../utils/coupon';
import { getProductColors } from '../../utils/variant';
import { getOptimizedImageUrl, generateSrcSet, CARD_SIZES } from '../../utils/image';
import { getColorFamilyId } from '../../utils/colorFamilies';

export interface ProductCardProps {
  product: Product;
  userMode: UserMode;
  locale: Locale;
  coupons?: Coupon[];

  // Variant controls layout style
  variant?: 'grid' | 'compact' | 'large';

  // Feature toggles
  showWishlist?: boolean;
  showQuickAdd?: boolean;
  showDiscountBadge?: boolean;
  showColorSwatches?: boolean;
  showCategory?: boolean;

  // Aspect ratio for image
  aspectRatio?: 'square' | 'portrait';

  // Wishlist state
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;

  // Quick add handler
  onAddToCart?: (item: any) => void;
  onQuickAdd?: (product: Product) => void;

  // Click handler
  onClick?: () => void;

  // Custom class
  className?: string;

  // Category name for display
  categoryName?: string;

  // Active color family filter — used to pick the matching variant image
  selectedColorFamilies?: string[];

  // Priority loading for above-the-fold cards (first ~6)
  priority?: boolean;
}

// ── Pure style helpers (module-level, never recreated) ──────────────────────

function getCardStyles(_variant: string): string {
  return 'border border-neutral-200 hover:border-neutral-300';
}

function getImageAspect(aspectRatio: string): string {
  return aspectRatio === 'portrait' ? 'aspect-[3/4]' : 'aspect-square';
}

const TEXT_SIZES = {
  large: { name: 'text-[12px] md:text-[13px]', price: 'text-[13px] md:text-[14px]', priceOriginal: 'text-[11px]' },
  compact: { name: 'text-[10px]', price: 'text-[11px]', priceOriginal: 'text-[9px]' },
  grid: { name: 'text-[11px]', price: 'text-[12px]', priceOriginal: 'text-[10px]' },
} as const;

// ── Component ───────────────────────────────────────────────────────────────

const ProductCardInner: React.FC<ProductCardProps> = ({
  product,
  userMode,
  locale,
  coupons = [],
  variant = 'grid',
  showWishlist = true,
  showQuickAdd = true,
  showDiscountBadge = true,
  showColorSwatches = true,
  showCategory = false,
  aspectRatio = 'square',
  isWishlisted = false,
  onToggleWishlist,
  onAddToCart,
  onQuickAdd,
  onClick,
  className = '',
  categoryName,
  selectedColorFamilies,
  priority = false
}) => {
  const getLoc = createGetLoc(locale);

  // When a color family filter is active, prefer the variant that matches it
  // Uses DB color_family when available, falls back to runtime classification
  const displayVariant = React.useMemo(() => {
    if (selectedColorFamilies?.length && product.variants?.length) {
      const match = product.variants.find(v => {
        const family = v.color_family || (v.color_hex ? getColorFamilyId(v.color_hex, v.color_name) : null);
        return family && selectedColorFamilies.includes(family);
      });
      if (match) return match;
    }
    return product.variants?.[0];
  }, [product.variants, selectedColorFamilies]);

  // Calculate price and discount
  const mainVariant = displayVariant;
  const rawPrice = mainVariant ? calculatePrice(mainVariant, userMode, product) : 0;
  const priceResult = getProductDisplayPrice(rawPrice, product.id, coupons);
  const { original, final, hasDiscount } = priceResult;
  const discountDisplay = priceResult.discountDisplay?.replace(/^-/, '') || '';

  // Image: use matching variant's image when available, fallback to product image
  const displayImg = displayVariant?.variant_images?.[0] || product.default_image_url || product.base_images[0];
  const colors = getProductColors(product.variants);
  const hasMultipleVariants = (product.variants?.length || 0) > 1;

  // Free shipping: use product flag or fallback to price >= 299
  const hasFreeShipping = product.has_free_shipping === true || final >= 299;

  const textSize = TEXT_SIZES[variant] ?? TEXT_SIZES.grid;
  const [imgLoaded, setImgLoaded] = useState(false);

  // Stable handlers — won't break React.memo on children
  const handleQuickAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultipleVariants && onQuickAdd) {
      onQuickAdd(product);
    } else if (mainVariant && onAddToCart) {
      onAddToCart({
        variant_id: mainVariant.id,
        product_id: product.id,
        name: product.name,
        image: displayImg,
        size: mainVariant.size || 'Único',
        color_name: mainVariant.color_name,
        color_hex: mainVariant.color_hex || '#000',
        price: final,
        original_price: hasDiscount ? original : undefined,
        quantity: 1,
        sku: mainVariant.sku
      });
    }
  }, [hasMultipleVariants, onQuickAdd, product, mainVariant, onAddToCart, displayImg, final, hasDiscount, original]);

  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist?.(product.id);
  }, [onToggleWishlist, product.id]);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer group flex flex-col relative transition-colors ${getCardStyles(variant)} ${className}`}
    >
      {/* Image Container */}
      <div className={`relative ${getImageAspect(aspectRatio)} overflow-hidden bg-neutral-50`}>
        {/* Shimmer placeholder while image loads */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
        )}
        <img
          src={getOptimizedImageUrl(displayImg, aspectRatio === 'portrait' ? 'small' : 'thumbnail')}
          srcSet={generateSrcSet(displayImg, ['thumbnail', 'small', 'medium'])}
          sizes={CARD_SIZES}
          alt={getLoc(product.name)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          width={400}
          height={aspectRatio === 'portrait' ? 533 : 400}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f5f5f5' width='100%25' height='100%25'/%3E%3C/svg%3E";
            setImgLoaded(true);
          }}
        />

        {/* Discount Badge - Domino Style */}
        {showDiscountBadge && hasDiscount && (
          <div className="absolute top-2 left-2 flex items-center shadow-lg z-10 rounded overflow-hidden">
            <div className="bg-white text-black px-2 py-1 flex items-center">
              <span className="text-[11px] font-black tracking-tight">{discountDisplay}</span>
            </div>
            <div className="bg-black text-white px-2 py-1">
              <span className="text-[11px] font-black tracking-tight">OFF</span>
            </div>
          </div>
        )}

        {/* Wishlist Button */}
        {showWishlist && onToggleWishlist && (
          <button
            onClick={handleWishlistToggle}
            aria-label="Toggle wishlist"
            className={`absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm transition-all ${
              isWishlisted ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        )}

        {/* Quick Add Button - Visible on mobile, animated on desktop */}
        {showQuickAdd && (onAddToCart || onQuickAdd) && (
          <button
            onClick={handleQuickAdd}
            aria-label="Adicionar ao carrinho"
            className="absolute bottom-2 right-2 flex items-center gap-2 bg-black text-white rounded-full shadow-lg transition-all duration-300 ease-out overflow-hidden whitespace-nowrap opacity-100 translate-y-0 p-2 md:opacity-0 md:translate-y-2 md:p-2.5 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:pr-4 hover:scale-105 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            <span className="text-[11px] font-medium uppercase tracking-wider hidden md:inline max-w-0 opacity-0 md:group-hover:max-w-[200px] md:group-hover:opacity-100 transition-all duration-300 ease-out">
              Adicionar
            </span>
          </button>
        )}

        {/* Free Shipping Badge */}
        {hasFreeShipping && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded shadow-lg z-10">
            <Truck className="w-3 h-3" strokeWidth={2} />
            <span className="text-[10px] font-black uppercase tracking-tight">Frete gratis</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-1">
        {/* Category */}
        {showCategory && categoryName && (
          <p className="text-[9px] text-neutral-400 uppercase tracking-wider font-medium">
            {categoryName}
          </p>
        )}

        {/* Product Name */}
        <h3 className={`${textSize.name} font-medium text-neutral-900 leading-tight truncate`}>
          {getLoc(product.name)}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          {hasDiscount && (
            <span className={`${textSize.priceOriginal} text-neutral-400 line-through`}>
              {formatCurrency(original, locale)}
            </span>
          )}
          <span className={`${textSize.price} font-semibold ${hasDiscount ? 'text-red-600' : 'text-neutral-900'}`}>
            {formatCurrency(final, locale)}
          </span>
        </div>

        {/* Color Swatches */}
        {showColorSwatches && colors.length > 0 && (
          <div className="flex items-center gap-0.5 pt-0.5">
            {colors.slice(0, 5).map((color) => (
              <div
                key={color.hex}
                className="w-2 h-2 rounded-full border border-neutral-300"
                style={
                  color.image
                    ? { backgroundImage: `url(${color.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { backgroundColor: color.hex }
                }
                title={getLoc(color.name)}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-[8px] text-neutral-500 font-medium ml-0.5">
                +{colors.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// React.memo — skips re-render when props are shallowly equal
// Critical: prevents all 12+ cards from re-rendering on every filter change
export const ProductCard = React.memo(ProductCardInner);
export default ProductCard;
