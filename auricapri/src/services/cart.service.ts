import { CartItem, Product, Asset, UserMode } from '../types';

/**
 * Serviço responsável pela validação e cálculos do carrinho de compras.
 * 
 * Valida estoque de produtos e assets (embalagens), verifica quantidades mínimas
 * para modo atacado e calcula subtotais e totais do carrinho.
 * 
 * @example
 * ```ts
 * const service = new CartService();
 * const validation = service.validateStock(cartItems, products, assets, UserMode.VAREJO);
 * if (!validation.valid) {
 *   console.error(validation.error);
 * }
 * ```
 */
export class CartService {
  /**
   * Valida o estoque de todos os itens do carrinho.
   * 
   * Verifica:
   * - Quantidade mínima para modo atacado (10 peças)
   * - Estoque disponível de cada variante
   * - Estoque disponível de assets (embalagens) necessários
   * 
   * @param items - Itens do carrinho
   * @param products - Lista de produtos disponíveis
   * @param assets - Lista de assets (embalagens) disponíveis
   * @param userMode - Modo do usuário (opcional, usado para validar quantidade mínima)
   * @returns Objeto com valid (boolean) e error (string opcional)
   */
  validateStock(items: CartItem[], products: Product[], assets: Asset[], userMode?: UserMode): { valid: boolean; error?: string } {
    // Validate minimum quantity for atacado mode
    if (userMode === UserMode.ATACADO) {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < 10) {
        return { 
          valid: false, 
          error: `Mínimo de 10 peças necessário no modo Atacado. Você tem ${totalQuantity} peça(s) no carrinho.` 
        };
      }
    }

    const requiredAssets: Record<string, number> = {};

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      const variant = product?.variants?.find(v => v.id === item.variant_id);
      
      if (!variant) continue;

      if (item.quantity > variant.stock_quantity) {
        const productName = typeof item.name === 'string' 
          ? item.name 
          : (item.name?.pt || item.name?.en || 'Produto');
        return { 
          valid: false, 
          error: `Estoque insuficiente para o produto: ${productName}` 
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

  /**
   * Calcula o subtotal do carrinho (soma de preço × quantidade de cada item).
   * 
   * @param items - Itens do carrinho
   * @returns Subtotal calculado
   */
  calculateSubtotal(items: CartItem[]): number {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  /**
   * Calcula o total do carrinho após aplicar desconto.
   * 
   * @param items - Itens do carrinho
   * @param discount - Valor do desconto a ser aplicado (padrão: 0)
   * @returns Total calculado (nunca negativo)
   */
  calculateTotal(items: CartItem[], discount: number = 0): number {
    const subtotal = this.calculateSubtotal(items);
    return Math.max(0, subtotal - discount);
  }
}

