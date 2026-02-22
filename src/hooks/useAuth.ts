import { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, Order } from '../types';
import { auth } from '../utils/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const previousUid = previousUidRef.current;

        // Merge anonymous cart on first login
        if (!previousUid && firebaseUser.uid) {
          try {
            const STORAGE_KEY = 'auricapri_cart_session_id';
            const sessionId = localStorage.getItem(STORAGE_KEY);
            if (sessionId) {
              await cartApi.mergeCart(sessionId);
              localStorage.removeItem(STORAGE_KEY);
              window.dispatchEvent(new CustomEvent('cart-merged'));
            }
          } catch (error) {
            logger.error('Error merging cart on login', error, { context: 'useAuth' });
          }
        }

        previousUidRef.current = firebaseUser.uid;

        // Fetch/create Supabase profile via backend
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch(`${apiBase}/auth/profile`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) throw new Error(`Profile fetch failed: ${response.status}`);

          const profile = await response.json();
          setCurrentUser(profile as UserProfile);
        } catch (err) {
          logger.error('Error fetching profile', err, { context: 'useAuth' });
          // Fallback profile
          const fallback: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            full_name: firebaseUser.displayName || firebaseUser.email || '',
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

    return () => unsubscribe();
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
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged handles the rest
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (metadata?.full_name) {
        await updateFirebaseProfile(result.user, { displayName: String(metadata.full_name) });
      }
      // onAuthStateChanged handles profile creation
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
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
