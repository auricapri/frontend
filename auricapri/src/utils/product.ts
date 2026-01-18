import { ProductVariant, Product, UserMode } from '../types';
import { pricingService } from '../services/pricing.service';

export function calculatePrice(variant: ProductVariant, userMode: UserMode, product?: Product): number {
  return pricingService.calculateRetailPrice(variant, userMode, product);
}

export function calculateWholesalePrice(costPrice: number, marginPercent: number = 20): number {
  return pricingService.calculateWholesalePrice(costPrice, marginPercent);
}

export function filterProductsForMode(products: Product[], userMode: UserMode): Product[] {
  if (userMode !== UserMode.ATACADO) return products;
  
  return products
    .map(product => ({
      ...product,
      variants: product.variants?.filter(v => v.stock_quantity >= 10) ?? []
    }))
    .filter(product => (product.variants?.length ?? 0) > 0);
}

export function getVariantDisplayPrice(
  variant: ProductVariant,
  userMode: UserMode,
  product?: Product
): { price: number; originalPrice?: number } {
  const price = calculatePrice(variant, userMode, product);
  
  if (userMode === UserMode.ATACADO) {
    return {
      price,
      originalPrice: variant.retail_price
    };
  }
  
  return { price };
}

export function calculateCartTotal(
  items: Array<{ variant: ProductVariant; quantity: number; product?: Product }>,
  userMode: UserMode
): number {
  return items.reduce((total, item) => {
    const price = calculatePrice(item.variant, userMode, item.product);
    return total + (price * item.quantity);
  }, 0);
}

export function isVariantAvailable(variant: ProductVariant, userMode: UserMode): boolean {
  if (!variant.is_active) return false;
  
  if (userMode === UserMode.ATACADO) {
    return variant.stock_quantity >= 10;
  }
  
  return variant.stock_quantity > 0;
}

export function getMinimumQuantity(userMode: UserMode): number {
  return userMode === UserMode.ATACADO ? 10 : 1;
}

export function formatPriceForDisplay(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

export function calculateDiscount(originalPrice: number, discountedPrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

export function applyPercentageDiscount(price: number, discountPercent: number): number {
  return price * (1 - discountPercent / 100);
}

export function applyFixedDiscount(price: number, discountAmount: number): number {
  return Math.max(0, price - discountAmount);
}
