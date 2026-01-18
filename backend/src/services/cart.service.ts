import { ProductsRepository } from '../repositories/products.repository.js';
import { AssetsRepository, type Asset } from '../repositories/assets.repository.js';
import type { CartItem, ProductVariant } from '../../shared/types/index.js';
import { CartCacheService } from './cart-cache.service.js';
import { CartRepository, type CartSession } from '../repositories/cart.repository.js';

export class CartService {
  private cartCache: CartCacheService;
  private cartRepo: CartRepository;
  private productsRepo: ProductsRepository;
  private assetsRepo: AssetsRepository;

  constructor() {
    this.cartCache = new CartCacheService();
    this.cartRepo = new CartRepository();
    this.productsRepo = new ProductsRepository();
    this.assetsRepo = new AssetsRepository();
  }

  async getCart(sessionKey: string): Promise<CartSession> {
    const cart = await this.cartCache.getCart(sessionKey);
    
    if (cart) {
      return cart;
    }

    return {
      id: '',
      session_key: sessionKey,
      user_id: null,
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async addItem(sessionKey: string, item: CartItem, userId?: string): Promise<CartSession> {
    const cart = await this.getCart(sessionKey);

    const existingItemIndex = cart.items.findIndex(
      (i) => i.variant_id === item.variant_id
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

    const { variants, assets } = await this.loadStockContext(cart.items);
    const validation = this.validateStock(cart.items, variants, assets);
    if (!validation.valid) {
      throw new Error(validation.error || 'Stock validation failed');
    }

    if (userId) {
      cart.user_id = userId;
    }

    cart.updated_at = new Date().toISOString();
    await this.cartCache.saveCart(sessionKey, cart);

    return cart;
  }

  async updateItem(sessionKey: string, variantId: string, quantity: number, userId?: string): Promise<CartSession> {
    const cart = await this.getCart(sessionKey);

    const itemIndex = cart.items.findIndex((i) => i.variant_id === variantId);
    if (itemIndex < 0) {
      throw new Error('Item not found in cart');
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    const { variants, assets } = await this.loadStockContext(cart.items);
    const validation = this.validateStock(cart.items, variants, assets);
    if (!validation.valid) {
      throw new Error(validation.error || 'Stock validation failed');
    }

    if (userId) {
      cart.user_id = userId;
    }

    cart.updated_at = new Date().toISOString();
    await this.cartCache.saveCart(sessionKey, cart);

    return cart;
  }

  async removeItem(sessionKey: string, variantId: string, userId?: string): Promise<CartSession> {
    const cart = await this.getCart(sessionKey);

    cart.items = cart.items.filter((i) => i.variant_id !== variantId);

    if (userId) {
      cart.user_id = userId;
    }

    cart.updated_at = new Date().toISOString();
    await this.cartCache.saveCart(sessionKey, cart);

    return cart;
  }

  async clearCart(sessionKey: string, _userId?: string): Promise<void> {
    await this.cartCache.deleteCart(sessionKey);
  }

  private async loadStockContext(items: CartItem[]): Promise<{ variants: ProductVariant[]; assets: Asset[] }> {
    const variantIds = [...new Set(items.map((i) => i.variant_id).filter(Boolean))] as string[];
    if (variantIds.length === 0) return { variants: [], assets: [] };

    const variants = await this.productsRepo.getVariantsByIds(variantIds);

    const requiredAssetIds = new Set<string>();
    for (const v of variants) {
      if (v.correlated_assets && Array.isArray(v.correlated_assets)) {
        v.correlated_assets.forEach((link) => requiredAssetIds.add(link.asset_id));
      }
    }

    const assets = requiredAssetIds.size > 0
      ? await this.assetsRepo.getByIds([...requiredAssetIds])
      : [];

    return { variants, assets };
  }

  validateStock(items: CartItem[], variants: ProductVariant[], assets: Asset[]): { valid: boolean; error?: string } {
    const requiredAssets: Record<string, number> = {};
    const variantsMap = new Map<string, ProductVariant>();
    variants.forEach((v) => variantsMap.set(v.id, v));
    const assetsMap = new Map<string, Asset>();
    assets.forEach((a) => assetsMap.set(a.id, a));

    for (const item of items) {
      const variantId = item.variant_id;
      const variant = variantId ? variantsMap.get(variantId) : undefined;
      
      if (!variant) continue;

      if (item.quantity > variant.stock_quantity) {
        const itemName = typeof item.name === 'string' 
          ? item.name 
          : (typeof item.name === 'object' && item.name !== null && 'pt' in item.name)
            ? (item.name as { pt?: string }).pt || 'Produto'
            : 'Produto';
        return { 
          valid: false, 
          error: `Estoque insuficiente para o produto: ${itemName}` 
        };
      }

      if (variant.correlated_assets) {
        variant.correlated_assets.forEach((link) => {
          const totalNeeded = link.quantity_required * item.quantity;
          requiredAssets[link.asset_id] = (requiredAssets[link.asset_id] || 0) + totalNeeded;
        });
      }
    }

    for (const [assetId, qty] of Object.entries(requiredAssets)) {
      const asset = assetsMap.get(assetId);
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

  /**
   * Faz merge do carrinho anônimo com o carrinho do usuário autenticado.
   * Soma quantidades se a mesma variante, adiciona se variantes diferentes.
   * 
   * @param anonymousSessionKey - Session key do carrinho anônimo (session:${sessionId})
   * @param userId - ID do usuário autenticado
   * @returns Carrinho merged
   */
  async mergeCarts(anonymousSessionKey: string, userId: string): Promise<CartSession> {
    const userSessionKey = `user:${userId}`;

    // Buscar ambos os carrinhos
    const anonymousCart = await this.getCart(anonymousSessionKey);
    const userCart = await this.getCart(userSessionKey);

    // Se não há carrinho anônimo, retornar carrinho do usuário (ou vazio)
    if (!anonymousCart || anonymousCart.items.length === 0) {
      return userCart || await this.getCart(userSessionKey);
    }

    // Se não há carrinho do usuário, apenas migrar o anônimo
    if (!userCart || userCart.items.length === 0) {
      anonymousCart.user_id = userId;
      anonymousCart.session_key = userSessionKey;
      await this.cartCache.saveCart(userSessionKey, anonymousCart);
      await this.cartCache.deleteCart(anonymousSessionKey);
      return anonymousCart;
    }

    // Fazer merge dos itens
    const mergedItems: CartItem[] = [...userCart.items];
    const itemsMap = new Map<string, number>(); // variant_id -> index em mergedItems

    mergedItems.forEach((item, index) => {
      itemsMap.set(item.variant_id, index);
    });

    // Adicionar itens do carrinho anônimo
    for (const anonymousItem of anonymousCart.items) {
      const existingIndex = itemsMap.get(anonymousItem.variant_id);
      
      if (existingIndex !== undefined) {
        // Mesma variante: somar quantidades
        mergedItems[existingIndex].quantity += anonymousItem.quantity;
      } else {
        // Variante diferente: adicionar novo item
        mergedItems.push(anonymousItem);
        itemsMap.set(anonymousItem.variant_id, mergedItems.length - 1);
      }
    }

    // Validar estoque após merge
    const { variants, assets } = await this.loadStockContext(mergedItems);
    const validation = this.validateStock(mergedItems, variants, assets);
    
    if (!validation.valid) {
      throw new Error(validation.error || 'Stock validation failed after merge');
    }

    // Criar carrinho merged
    const mergedCart: CartSession = {
      id: userCart.id || '',
      session_key: userSessionKey,
      user_id: userId,
      items: mergedItems,
      created_at: userCart.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: userCart.expires_at || null,
    };

    // Salvar carrinho merged
    await this.cartCache.saveCart(userSessionKey, mergedCart);
    
    // Deletar carrinho anônimo
    await this.cartCache.deleteCart(anonymousSessionKey);

    return mergedCart;
  }
}
