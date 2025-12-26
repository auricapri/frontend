import { useState, useCallback, useMemo } from 'react';
import { CartItem, Product, Asset } from '../types';
import { CartService } from '../services/cart.service';

export const useCart = (products: Product[], assets: Asset[]) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const cartService = useMemo(() => new CartService(), []);

  const addToCart = useCallback((cartItem: CartItem) => {
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
    
    return { success: true };
  }, [products, cartItems]);

  const updateQuantity = useCallback((variantId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.variant_id === variantId) {
          const product = products.find(p => p.id === item.product_id);
          const variant = product?.variants?.find(v => v.id === item.variant_id);
          const maxStock = variant?.stock_quantity || 0;
          
          if (delta > 0 && item.quantity + delta > maxStock) {
            return item;
          }
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  }, [products]);

  const removeFromCart = useCallback((variantId: string) => {
    setCartItems(prev => prev.filter(item => item.variant_id !== variantId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

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
    setCartItems
  };
};

