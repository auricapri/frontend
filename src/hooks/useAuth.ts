import { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, Order } from '../types';
import { supabase } from '../utils/supabase';
import { CartApi } from '../api/cart.api';
import { logger } from '../utils/logger';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const cartApi = useRef(new CartApi()).current;
  const previousUidRef = useRef<string | null>(null);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

  useEffect(() => {
    // Sequence counter: each auth event increments it. Async profile fetches
    // capture their sequence value and discard results if a newer event has
    // already arrived (prevents stale TOKEN_REFRESHED fetch from overwriting
    // a SIGNED_OUT that arrived while the fetch was in-flight).
    let seq = 0;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const mySeq = ++seq;

      if (session?.user) {
        const previousUid = previousUidRef.current;
        previousUidRef.current = session.user.id;

        try {
          // Fetch full profile from backend (includes loyalty, saved_cards, etc.)
          const response = await fetch(`${apiBase}/users/profile`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          // Discard if a newer auth event (e.g. SIGNED_OUT) arrived while fetching
          if (mySeq !== seq) return;

          if (!response.ok) throw new Error(`Profile fetch failed: ${response.status}`);
          const profile = await response.json();

          if (mySeq !== seq) return;
          setCurrentUser(profile as UserProfile);

          // Merge cart on login (fire-and-forget)
          if (!previousUid && session.user.id) {
            const STORAGE_KEY = 'auricapri_cart_session_id';
            let sessionId: string | null = null;
            try {
              const raw = localStorage.getItem(STORAGE_KEY);
              if (raw) {
                const entry = JSON.parse(raw) as { data: string; expiry: number };
                if (entry.data && entry.expiry > Date.now()) {
                  sessionId = entry.data;
                }
              }
            } catch { /* ignore parse error */ }
            if (sessionId) {
              cartApi.mergeCart(sessionId)
                .then(() => {
                  localStorage.removeItem(STORAGE_KEY);
                  window.dispatchEvent(new CustomEvent('cart-merged'));
                })
                .catch((error) => {
                  logger.error('Error merging cart on login', error, { context: 'useAuth' });
                  window.dispatchEvent(new CustomEvent('cart-merge-failed'));
                });
            }
          }
        } catch (err) {
          if (mySeq !== seq) return;
          logger.error('Error fetching profile', err, { context: 'useAuth' });
          // Fallback profile
          const fallback: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email || '',
            role: 'customer',
            loyalty: { current_xp: 0, current_level: 0, cashback_balance: 0, pending_reward_coupon: null },
          };
          setCurrentUser(fallback);
        }
      } else {
        previousUidRef.current = null;
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserOrders = useCallback(async () => {
    if (!currentUser) {
      setUserOrders([]);
      return;
    }
    setIsLoadingOrders(true);
    try {
      const { OrdersApi } = await import('../api/orders.api');
      const ordersApi = new OrdersApi();
      const orders = await ordersApi.getByUserId(currentUser.id);
      setUserOrders(orders);
    } catch (error) {
      logger.error('Error fetching user orders', error, { context: 'useAuth' });
      setUserOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchUserOrders();
    } else {
      setUserOrders([]);
    }
  }, [currentUser, fetchUserOrders]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: String(metadata?.full_name || ''),
            ...(metadata?.referred_by_code ? { referred_by_code: metadata.referred_by_code } : {}),
          },
        },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('auricapri_cart_items');
      localStorage.removeItem('auricapri_cart_last_sync');
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return {
    currentUser,
    isLoading,
    userOrders,
    isLoadingOrders,
    refreshOrders: fetchUserOrders,
    signIn,
    signUp,
    signOut,
  };
};
