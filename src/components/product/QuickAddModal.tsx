import React, { useState, useMemo, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag, Check, ImageOff } from 'lucide-react';
import { Product, UserMode, LocalizedText, Coupon } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { calculatePrice } from '../../utils/product';
import { getDisplayPrice as getProductDisplayPrice } from '../../utils/coupon';
import { getOptimizedImageUrl } from '../../utils/image';

interface QuickAddModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: any) => void;
  userMode: UserMode;
  locale: Locale;
  getLoc: (text: LocalizedText | undefined) => string;
  coupons?: Coupon[];
  initialColorHex?: string;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  userMode,
  locale,
  getLoc,
  coupons = [],
  initialColorHex,
}) => {
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Extract unique colors
  const colors = useMemo(() => {
    const uniqueColors = new Map<string, LocalizedText>();
    product.variants?.forEach(v => {
      if (v.color_hex && !uniqueColors.has(v.color_hex)) {
        uniqueColors.set(v.color_hex, v.color_name);
      }
    });
    return Array.from(uniqueColors.entries()).map(([hex, name]) => ({ hex, name }));
  }, [product.variants]);

  // Get sizes available for selected color
  const availableSizes = useMemo(() => {
    if (!selectedColorHex) return [];
    const sizes = new Set<string>();
    product.variants?.forEach(v => {
      if (v.color_hex === selectedColorHex && v.size && v.stock_quantity > 0) {
        sizes.add(v.size);
      }
    });
    return Array.from(sizes);
  }, [product.variants, selectedColorHex]);

  // Get active variant
  const activeVariant = useMemo(() => {
    return product.variants?.find(
      v => v.color_hex === selectedColorHex && v.size === selectedSize
    );
  }, [product.variants, selectedColorHex, selectedSize]);

  // Auto-select first color
  useEffect(() => {
    if (colors.length > 0 && !selectedColorHex) {
      setSelectedColorHex(colors[0].hex);
    }
  }, [colors, selectedColorHex]);

  // Auto-select first size when color changes
  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize || '')) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  // Reset state when modal opens — prefer initialColorHex from the card
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setIsAdded(false);
      const startColor = initialColorHex && colors.some(c => c.hex === initialColorHex)
        ? initialColorHex
        : colors[0]?.hex || null;
      setSelectedColorHex(startColor);
    }
  }, [isOpen, colors, initialColorHex]);

  const rawPrice = activeVariant ? calculatePrice(activeVariant, userMode, product) : 0;
  const priceResult = getProductDisplayPrice(rawPrice, product.id, coupons);
  const { original, final: price, hasDiscount } = priceResult;
  const displayImg = activeVariant?.variant_images?.[0] || product.default_image_url || product.base_images?.[0];
  const inStock = (activeVariant?.stock_quantity || 0) > 0;
  const maxQty = activeVariant?.stock_quantity || 1;

  const handleAddToCart = () => {
    if (!activeVariant || !inStock) return;

    onAddToCart({
      variant_id: activeVariant.id,
      product_id: product.id,
      name: product.name,
      image: displayImg,
      size: activeVariant.size || 'Único',
      color_name: activeVariant.color_name,
      color_hex: activeVariant.color_hex || '#000',
      price: price,
      original_price: hasDiscount ? original : undefined,
      quantity: quantity,
      sku: activeVariant.sku
    });

    setIsAdded(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[200] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-[201]">
        <div
          className="bg-paper rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-4 border-b border-neutral-100">
            {/* Product Image */}
            <div className="w-20 h-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
              {displayImg ? (
                <img
                  src={getOptimizedImageUrl(displayImg, 'small')}
                  alt={getLoc(product.name)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute('hidden'); }}
                />
              ) : null}
              <div hidden={!!displayImg} className="w-full h-full flex items-center justify-center">
                <ImageOff className="w-6 h-6 text-neutral-300" />
              </div>
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold font-serif uppercase tracking-wide text-neutral-900 truncate">
                {getLoc(product.name)}
              </h3>
              {selectedColorHex && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  {getLoc(colors.find(c => c.hex === selectedColorHex)?.name)}
                  {selectedSize && ` • ${selectedSize}`}
                </p>
              )}
              <div className="mt-2 flex items-baseline gap-2">
                {hasDiscount && (
                  <span className="text-sm text-neutral-400 line-through">
                    {formatCurrency(original * quantity, locale)}
                  </span>
                )}
                <span className={`text-lg font-black ${hasDiscount ? 'text-red-600' : 'text-neutral-900'}`}>
                  {formatCurrency(price * quantity, locale)}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 -mr-2 -mt-1 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Options */}
          <div className="p-4 space-y-4">
            {/* Colors */}
            {colors.length > 1 && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Cor
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => {
                        setSelectedColorHex(color.hex);
                        setSelectedSize(null);
                      }}
                      className={`flex-shrink-0 w-10 h-10 rounded-full border-2 p-0.5 transition-all ${
                        selectedColorHex === color.hex
                          ? 'border-neutral-900 scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                    >
                      <div
                        className="w-full h-full rounded-full border border-neutral-200"
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {availableSizes.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Tamanho
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-10 px-4 rounded-lg text-sm font-medium transition-all border ${
                        selectedSize === size
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Quantidade
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-300 disabled:opacity-30 hover:bg-neutral-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-lg font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                  disabled={quantity >= maxQty}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-300 disabled:opacity-30 hover:bg-neutral-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {maxQty <= 5 && (
                  <span className="text-xs text-orange-500 font-medium">
                    Últimas {maxQty} unidades
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 pt-0">
            <button
              onClick={handleAddToCart}
              disabled={!activeVariant || !inStock || isAdded}
              className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isAdded
                  ? 'bg-green-500 text-white'
                  : !inStock
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98]'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  Adicionado!
                </>
              ) : !inStock ? (
                'Esgotado'
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Adicionar ao Carrinho
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
