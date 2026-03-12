import { ProductVariant, Product, UserMode, CartItem } from '../types';
import { pricingService } from '../services/pricing.service';

// Accessory bundle promotion: accessories get a discount when bought with clothing
export const ACCESSORY_CATEGORY_ID = 'b2f3481f-74c1-462d-aca9-3769a381753b';
export const ACCESSORY_BUNDLE_DISCOUNT_PCT = 15; // 15% off accessories when bought with clothing

export function computeAccessoryBundleDiscount(
  items: CartItem[],
  products: Product[]
): number {
  const productMap = new Map(products.map(p => [p.id, p]));
  const hasClothing = items.some(item => {
    const cat = productMap.get(item.product_id)?.category_id;
    return cat && cat !== ACCESSORY_CATEGORY_ID;
  });
  if (!hasClothing) return 0;
  return items.reduce((sum, item) => {
    const cat = productMap.get(item.product_id)?.category_id;
    if (cat === ACCESSORY_CATEGORY_ID) {
      return sum + item.price * item.quantity * (ACCESSORY_BUNDLE_DISCOUNT_PCT / 100);
    }
    return sum;
  }, 0);
}

export function isAccessoryItem(item: CartItem, products: Product[]): boolean {
  return products.find(p => p.id === item.product_id)?.category_id === ACCESSORY_CATEGORY_ID;
}

export function calculatePrice(variant: ProductVariant, userMode: UserMode, product?: Product): number {
  return pricingService.calculateRetailPrice(variant, userMode, product);
}

export function calculateWholesalePrice(costPrice: number, marginPercent: number = 20): number {
  return pricingService.calculateWholesalePrice(costPrice, marginPercent);
}

export function filterProductsForMode(products: Product[], userMode: UserMode): Product[] {
  // Always hide products with no variants (would display price 0)
  const withVariants = products.filter(p => (p.variants?.length ?? 0) > 0);

  if (userMode !== UserMode.ATACADO) return withVariants;

  return withVariants
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
