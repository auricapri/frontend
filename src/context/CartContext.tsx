import React, { createContext, useContext, ReactNode } from 'react';
import { CartItem } from '../types';
import { useCart } from '../hooks/useCart';
import { useAppContext } from './AppContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (variantId: string, delta: number) => Promise<void>;
  removeFromCart: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  validateStock: () => { valid: boolean; error?: string };
  subtotal: number;
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
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
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { products, assets } = useAppContext();
  const cart = useCart(products, assets);

  return (
    <CartContext.Provider value={cart}>
      {children}
    </CartContext.Provider>
  );
};

