import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CartItem, Product, Asset } from '../types';
import { CartService } from '../services/cart.service';
import { CartApi } from '../api/cart.api';
import { logger } from '../utils/logger';

const CART_STORAGE_KEY = 'auricapri_cart_items';
const CART_LAST_SYNC_KEY = 'auricapri_cart_last_sync';
const CART_CHECKOUT_PREFILL_KEY = 'auricapri_checkout_prefill';
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface StorageEntry<T> {
  data: T;
  expiry: number;
}

function readWithTTL<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as StorageEntry<T>;
    if (typeof entry.expiry === 'number' && entry.expiry < Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data ?? null;
  } catch {
    return null;
  }
}

function writeWithTTL<T>(key: string, data: T, ttlMs: number): void {
  try {
    const entry: StorageEntry<T> = { data, expiry: Date.now() + ttlMs };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (err) {
    logger.warn('Failed to write to localStorage with TTL', err, { context: 'useCart' });
  }
}

// LGPD-safe session-scoped write (no TTL, clears on tab close).
// Used for checkout prefill to avoid persisting customer PII to localStorage.
function writeSessionPrefill<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    logger.warn('Failed to write to sessionStorage', err, { context: 'useCart' });
  }
}

export const useCart = (products: Product[], assets: Asset[]) => {
  // Inicializa com itens do localStorage para persistência
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = readWithTTL<CartItem[]>(CART_STORAGE_KEY);
    return saved ?? [];
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
      const lastSync = readWithTTL<number>(CART_LAST_SYNC_KEY);
      if (lastSync && Date.now() - lastSync < SYNC_INTERVAL_MS) {
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
      writeWithTTL(CART_LAST_SYNC_KEY, Date.now(), CART_TTL_MS);
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

    const CART_TOKEN_REGEX = /^cs_[a-zA-Z0-9_-]{10,64}$/;
    if (cartToken && CART_TOKEN_REGEX.test(cartToken)) {
      const tokenApi = new CartApi();
      tokenApi.loadCartByToken(encodeURIComponent(cartToken))
        .then(session => {
          if (session.items && session.items.length > 0) {
            setCartItems(session.items);
            writeWithTTL(CART_STORAGE_KEY, session.items, CART_TTL_MS);

            // Store pre-fill data for checkout.
            // LGPD: use sessionStorage (clears on tab close, no 7-day retention).
            // Strip email/phone — only structural fields needed for form prefill.
            if (session.customer || session.address) {
              const { email: _e, phone: _p, ...safeCustomer } = session.customer ?? {};
              writeSessionPrefill(CART_CHECKOUT_PREFILL_KEY, {
                customer: Object.keys(safeCustomer).length ? safeCustomer : undefined,
                address: session.address,
              });
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
    writeWithTTL(CART_STORAGE_KEY, cartItems, CART_TTL_MS);
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

      writeWithTTL(CART_LAST_SYNC_KEY, Date.now(), CART_TTL_MS);
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

  // Called after login cart merge: adds server-only items without overwriting local ones.
  // Local cart is the source of truth for items added this session.
  const mergeFromServer = useCallback(async () => {
    try {
      const serverCart = await cartApi.getCart();
      if (!serverCart.items || serverCart.items.length === 0) return;
      setCartItems(prev => {
        const localVariantIds = new Set(prev.map(i => i.variant_id));
        const newItems = serverCart.items.filter(i => !localVariantIds.has(i.variant_id));
        if (newItems.length === 0) return prev;
        return [...prev, ...newItems];
      });
    } catch (err) {
      logger.warn('mergeFromServer failed, keeping local cart', err, { context: 'useCart' });
    }
  }, [cartApi]);

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
    mergeFromServer,
    needsServerSync,
  };
};

