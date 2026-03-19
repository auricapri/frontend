import React, { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { CartItem, Product, Asset } from '../types';
import { useCart } from '../hooks/useCart';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => { success: boolean; error?: string };
  updateQuantity: (variantId: string, delta: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  validateStock: () => { valid: boolean; error?: string };
  subtotal: number;
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  syncCartToServer: () => Promise<{ success: boolean; error?: string }>;
  mergeFromServer: () => Promise<void>;
  needsServerSync: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
  products: Product[];
  assets: Asset[];
}

export const CartProvider: React.FC<CartProviderProps> = ({ children, products, assets }) => {
  const cart = useCart(products, assets);

  // Listen for cart merge event after login.
  // Use mergeFromServer so local items (added as guest) take precedence over server items.
  const handleCartMerged = useCallback(() => {
    cart.mergeFromServer();
  }, [cart]);

  useEffect(() => {
    window.addEventListener('cart-merged', handleCartMerged);
    return () => window.removeEventListener('cart-merged', handleCartMerged);
  }, [handleCartMerged]);

  return (
    <CartContext.Provider value={cart}>
      {children}
    </CartContext.Provider>
  );
};

