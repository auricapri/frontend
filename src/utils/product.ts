import { ProductVariant, Product, UserMode } from '../types';

/**
 * Calcula o preço de um produto baseado no modo do usuário
 * No modo ATACADO: cost_price * 1.20 (preço de custo + 20%)
 * No modo VAREJO: retail_price
 */
export function calculatePrice(variant: ProductVariant, userMode: UserMode): number {
  if (userMode === UserMode.ATACADO) {
    const costPrice = variant.cost_price || 0;
    return costPrice * 1.20; // cost_price + 20%
  }
  return variant.retail_price;
}

/**
 * Filtra produtos para o modo atacado, removendo variantes com estoque < 10
 * Produtos sem variantes válidas são removidos
 */
export function filterProductsForMode(products: Product[], userMode: UserMode): Product[] {
  if (userMode !== UserMode.ATACADO) return products;
  
  return products
    .map(product => ({
      ...product,
      variants: product.variants?.filter(v => v.stock_quantity >= 10) || []
    }))
    .filter(product => (product.variants?.length || 0) > 0);
}

