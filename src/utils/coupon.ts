/**
 * Coupon Utilities
 * Shared functions for coupon calculations and discount application
 * Used by ProductDetail, ProductGrid, Cart, and Checkout components
 */

import type { Coupon } from '../types';

/**
 * Result of applying a coupon to a price
 */
export interface PriceWithDiscount {
  /** Original price before discount */
  original: number;
  /** Final price after discount */
  final: number;
  /** Whether a discount was applied */
  hasDiscount: boolean;
  /** Coupon code if applied */
  code?: string;
  /** Formatted discount display (e.g., "-10%", "-R$ 15,00") */
  discountDisplay?: string;
}

/**
 * Finds an active coupon that applies to a specific product
 * @param productId - The product ID to check
 * @param coupons - Array of available coupons
 * @returns The applicable coupon or undefined
 */
export function getProductCoupon(productId: string, coupons: Coupon[]): Coupon | undefined {
  return coupons.find(coupon =>
    coupon.is_active &&
    coupon.product_ids?.includes(productId)
  );
}

/**
 * Checks if a coupon is valid (active and not expired)
 * @param coupon - The coupon to validate
 * @returns Whether the coupon is currently valid
 */
export function isCouponValid(coupon: Coupon): boolean {
  if (!coupon.is_active) return false;

  if (coupon.expires_at) {
    const expiryDate = new Date(coupon.expires_at);
    if (expiryDate < new Date()) return false;
  }

  return true;
}

/**
 * Applies a coupon discount to a price
 * @param price - The original price
 * @param coupon - The coupon to apply
 * @returns The discounted price
 */
export function applyCouponDiscount(price: number, coupon: Coupon): number {
  if (!isCouponValid(coupon)) return price;

  if (coupon.discount_type === 'percentage') {
    return price * (1 - coupon.discount_value / 100);
  } else {
    return Math.max(0, price - coupon.discount_value);
  }
}

/**
 * Formats a discount value for display
 * @param coupon - The coupon with discount info
 * @param locale - Locale for number formatting (default: 'pt-BR')
 * @returns Formatted discount string (e.g., "-10%", "-R$ 15,00")
 */
export function formatDiscountDisplay(coupon: Coupon, locale = 'pt-BR'): string {
  if (coupon.discount_type === 'percentage') {
    return `-${coupon.discount_value}%`;
  } else {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'BRL',
    }).format(coupon.discount_value);
    return `-${formatted}`;
  }
}

/**
 * Calculates the final price with any applicable coupon discount
 * Returns full pricing information including discount display
 *
 * @param price - The original price
 * @param productId - The product ID to check for applicable coupons
 * @param coupons - Array of available coupons
 * @returns PriceWithDiscount object with all pricing details
 *
 * @example
 * const priceInfo = getDisplayPrice(100, 'product-123', coupons);
 * // Returns: { original: 100, final: 90, hasDiscount: true, code: 'SALE10', discountDisplay: '-10%' }
 */
export function getDisplayPrice(
  price: number,
  productId: string,
  coupons: Coupon[]
): PriceWithDiscount {
  const activeCoupon = getProductCoupon(productId, coupons);

  if (!activeCoupon) {
    return {
      original: price,
      final: price,
      hasDiscount: false,
    };
  }

  const finalPrice = applyCouponDiscount(price, activeCoupon);

  return {
    original: price,
    final: finalPrice,
    hasDiscount: finalPrice < price,
    code: activeCoupon.code,
    discountDisplay: formatDiscountDisplay(activeCoupon),
  };
}

/**
 * Calculates discount amount from original and final prices
 * @param original - Original price
 * @param final - Final price after discount
 * @returns Discount amount
 */
export function getDiscountAmount(original: number, final: number): number {
  return Math.max(0, original - final);
}

/**
 * Calculates discount percentage from original and final prices
 * @param original - Original price
 * @param final - Final price after discount
 * @returns Discount percentage (0-100)
 */
export function getDiscountPercentage(original: number, final: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - final) / original) * 100);
}
