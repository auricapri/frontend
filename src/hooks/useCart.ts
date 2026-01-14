import { useState, useCallback, useMemo, useEffect } from 'react';
import { CartItem, Product, Asset } from '../types';
import { CartService } from '../services/cart.service';
import { CartApi } from '../api/cart.api';

export const useCart = (products: Product[], assets: Asset[]) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cartService = useMemo(() => new CartService(), []);
  const cartApi = useMemo(() => new CartApi(), []);

  const loadCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cart = await cartApi.getCart();
      setCartItems(cart.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cart';
      setError(errorMessage);
      console.error('Error loading cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cartApi]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addToCart = useCallback(async (cartItem: CartItem) => {
    const product = products.find(p => p.id === cartItem.product_id);
    const variant = product?.variants?.find(v => v.id === cartItem.variant_id);
    const maxStock = variant?.stock_quantity || 0;
    
    if (cartItem.quantity > maxStock) {
      return { success: false, error: "Estoque insuficiente." };
    }
    
    const existingItem = cartItems.find(item => item.variant_id === cartItem.variant_id);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    
    if (currentQtyInCart + cartItem.quantity > maxStock) {
      return { success: false, error: `Limite atingido!` };
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.variant_id === cartItem.variant_id);
      if (existing) {
        return prev.map(item => item.variant_id === cartItem.variant_id 
          ? { ...item, quantity: item.quantity + cartItem.quantity } 
          : item
        );
      }
      return [...prev, cartItem];
    });

    try {
      setIsSyncing(true);
      setError(null);
      const cart = await cartApi.addItem(cartItem);
      setCartItems(cart.items || []);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart';
      setError(errorMessage);
      await loadCart();
      return { success: false, error: errorMessage };
    } finally {
      setIsSyncing(false);
    }
  }, [products, cartItems, cartApi, loadCart]);

  const updateQuantity = useCallback(async (variantId: string, delta: number) => {
    const item = cartItems.find(i => i.variant_id === variantId);
    if (!item) return;

    const product = products.find(p => p.id === item.product_id);
    const variant = product?.variants?.find(v => v.id === item.variant_id);
    const maxStock = variant?.stock_quantity || 0;
    
    const newQuantity = Math.max(0, item.quantity + delta);
    
    if (delta > 0 && newQuantity > maxStock) {
      return;
    }

    setCartItems(prev => {
      return prev.map(i => {
        if (i.variant_id === variantId) {
          return { ...i, quantity: newQuantity };
        }
        return i;
      }).filter(i => i.quantity > 0);
    });

    try {
      setIsSyncing(true);
      setError(null);
      const cart = await cartApi.updateItem(variantId, newQuantity);
      setCartItems(cart.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cart item';
      setError(errorMessage);
      await loadCart();
    } finally {
      setIsSyncing(false);
    }
  }, [products, cartItems, cartApi, loadCart]);

  const removeFromCart = useCallback(async (variantId: string) => {
    setCartItems(prev => prev.filter(item => item.variant_id !== variantId));

    try {
      setIsSyncing(true);
      setError(null);
      const cart = await cartApi.removeItem(variantId);
      setCartItems(cart.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart';
      setError(errorMessage);
      await loadCart();
    } finally {
      setIsSyncing(false);
    }
  }, [cartApi, loadCart]);

  const clearCart = useCallback(async () => {
    setCartItems([]);

    try {
      setIsSyncing(true);
      setError(null);
      await cartApi.clearCart();
      setCartItems([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart';
      setError(errorMessage);
      await loadCart();
    } finally {
      setIsSyncing(false);
    }
  }, [cartApi, loadCart]);

  const validateStock = useCallback((): { valid: boolean; error?: string } => {
    return cartService.validateStock(cartItems, products, assets);
  }, [cartItems, products, assets, cartService]);

  const subtotal = useMemo(() => {
    return cartService.calculateSubtotal(cartItems);
  }, [cartItems, cartService]);

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    validateStock,
    subtotal,
    setCartItems,
    isLoading,
    isSyncing,
    error,
    refreshCart: loadCart,
  };
};

