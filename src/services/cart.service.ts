import { CartItem, Product, Asset } from '../types';

export class CartService {
  validateStock(items: CartItem[], products: Product[], assets: Asset[]): { valid: boolean; error?: string } {
    const requiredAssets: Record<string, number> = {};

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      const variant = product?.variants?.find(v => v.id === item.variant_id);
      
      if (!variant) continue;

      if (item.quantity > variant.stock_quantity) {
        return { 
          valid: false, 
          error: `Estoque insuficiente para o produto: ${typeof item.name === 'string' ? item.name : (item.name as any).pt}` 
        };
      }

      if (variant.correlated_assets) {
        variant.correlated_assets.forEach(link => {
          const totalNeeded = link.quantity_required * item.quantity;
          requiredAssets[link.asset_id] = (requiredAssets[link.asset_id] || 0) + totalNeeded;
        });
      }
    }

    for (const [assetId, qty] of Object.entries(requiredAssets)) {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) {
        return { valid: false, error: `Erro interno: Insumo necessário não encontrado.` };
      }
      if (qty > asset.stock_quantity) {
        return { 
          valid: false, 
          error: `Não há estoque suficiente do insumo: ${asset.name}. Necessário: ${qty}, Disponível: ${asset.stock_quantity}.` 
        };
      }
    }

    return { valid: true };
  }

  calculateSubtotal(items: CartItem[]): number {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  calculateTotal(items: CartItem[], discount: number = 0): number {
    const subtotal = this.calculateSubtotal(items);
    return Math.max(0, subtotal - discount);
  }
}

