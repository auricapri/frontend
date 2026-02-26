import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CartItem, Product, Asset } from '../types';
import { CartService } from '../services/cart.service';
import { CartApi } from '../api/cart.api';
import { logger } from '../utils/logger';

const CART_STORAGE_KEY = 'auricapri_cart_items';
const CART_LAST_SYNC_KEY = 'auricapri_cart_last_sync';
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export const useCart = (products: Product[], assets: Asset[]) => {
  // Inicializa com itens do localStorage para persistência
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsServerSync, setNeedsServerSync] = useState(false);
  const cartService = useMemo(() => new CartService(), []);
  const cartApi = useMemo(() => new CartApi(), []);
  const initialSyncDone = useRef(false);
  const locallyModifiedRef = useRef(false);

  // Sync cart from server only on initial load or when explicitly requested
  const loadCart = useCallback(async (force = false) => {
    // Skip if already synced recently (unless forced)
    if (!force) {
      const lastSync = localStorage.getItem(CART_LAST_SYNC_KEY);
      if (lastSync && Date.now() - parseInt(lastSync) < SYNC_INTERVAL_MS) {
        setIsLoading(false);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      const cart = await cartApi.getCart();
      if (cart.items && cart.items.length > 0 && !locallyModifiedRef.current) {
        setCartItems(cart.items);
      }
      locallyModifiedRef.current = false;
      localStorage.setItem(CART_LAST_SYNC_KEY, Date.now().toString());
      setNeedsServerSync(false);
    } catch (err) {
      // On error, keep using localStorage cart - don't block user
      logger.warn('Failed to sync cart from server, using local cart', err, { context: 'useCart' });
    } finally {
      setIsLoading(false);
    }
  }, [cartApi]);

  // Initial sync only once
  useEffect(() => {
    if (!initialSyncDone.current) {
      initialSyncDone.current = true;
      loadCart();
    }
  }, [loadCart]);

  // Load cart from WhatsApp token (if present in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cartToken = params.get('cart_token');

    if (cartToken && cartToken.startsWith('cs_')) {
      const tokenApi = new CartApi();
      tokenApi.loadCartByToken(cartToken)
        .then(session => {
          if (session.items && session.items.length > 0) {
            setCartItems(session.items);
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(session.items));

            // Store pre-fill data for checkout
            if (session.customer || session.address) {
              localStorage.setItem('auricapri_checkout_prefill', JSON.stringify({
                customer: session.customer,
                address: session.address,
              }));
            }

            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('cart_token');
            window.history.replaceState({}, '', url.pathname);

            // Dispatch event for navigation
            window.dispatchEvent(new CustomEvent('cart-token-loaded', {
              detail: { items: session.items, customer: session.customer, address: session.address }
            }));
          }
        })
        .catch(err => {
          logger.error('Failed to load WhatsApp cart', err, { context: 'useCart' });
        });
    }
  }, []); // Run once on mount

  // Persistir carrinho no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (err) {
      logger.warn('Failed to persist cart to localStorage', err, { context: 'useCart' });
    }
  }, [cartItems]);

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

    locallyModifiedRef.current = true;
    setNeedsServerSync(true);
    return { success: true };
  }, [products, cartItems]);

  const updateQuantity = useCallback((variantId: string, delta: number) => {
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

    locallyModifiedRef.current = true;
    setNeedsServerSync(true);
  }, [products, cartItems]);

  const removeFromCart = useCallback((variantId: string) => {
    setCartItems(prev => prev.filter(item => item.variant_id !== variantId));
    locallyModifiedRef.current = true;
    setNeedsServerSync(true);
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setNeedsServerSync(true);
  }, []);

  // Sync cart to server - call this before checkout
  const syncCartToServer = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (cartItems.length === 0) {
      // Clear server cart if local is empty
      try {
        setIsSyncing(true);
        await cartApi.clearCart();
        setNeedsServerSync(false);
        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to clear server cart';
        logger.error('Error clearing server cart', err, { context: 'useCart' });
        return { success: false, error: errorMessage };
      } finally {
        setIsSyncing(false);
      }
    }

    try {
      setIsSyncing(true);
      setError(null);

      // First clear the server cart, then add all items
      await cartApi.clearCart();

      // Add each item to server
      for (const item of cartItems) {
        await cartApi.addItem(item);
      }

      localStorage.setItem(CART_LAST_SYNC_KEY, Date.now().toString());
      setNeedsServerSync(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync cart to server';
      setError(errorMessage);
      logger.error('Error syncing cart to server', err, { context: 'useCart' });
      return { success: false, error: errorMessage };
    } finally {
      setIsSyncing(false);
    }
  }, [cartItems, cartApi]);

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
    syncCartToServer,
    needsServerSync,
  };
};

