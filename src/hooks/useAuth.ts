import { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, Order } from '../types';
import { supabase } from '../utils/supabase';
import { UsersApi } from '../api/users.api';
import { AuthApi } from '../api/auth.api';
import { CartApi } from '../api/cart.api';
import { logger } from '../utils/logger';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const usersApi = new UsersApi();
  const authApi = new AuthApi();
  const cartApi = useRef(new CartApi()).current;
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const processOAuthHash = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      if (!hash || hash.length === 0) return;

      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      if (error) {
        logger.error('OAuth error', { error, errorDescription }, { context: 'useAuth' });
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return;
      }

      if (accessToken) {
        try {
          const refreshToken = hashParams.get('refresh_token') || '';

          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            logger.error('Error setting session from OAuth hash', sessionError, { context: 'useAuth' });
          }

          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (error) {
          logger.error('Error processing OAuth hash', error, { context: 'useAuth' });
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };

    processOAuthHash();
  }, []);

  useEffect(() => {
    let isInitialLoad = true;

    const fetchProfile = async (user: { id: string; email?: string | null; user_metadata?: Record<string, any> }) => {
      try {
        const profile = await usersApi.getProfile(user.id);
        if (!profile) throw new Error('Profile not found');
        setCurrentUser(profile);
      } catch (err) {
        logger.error('Error fetching profile', err, { context: 'useAuth' });
        const fallback: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name: String(user.user_metadata?.full_name || user.email || ''),
          role: 'customer',
          loyalty: { current_xp: 0, current_level: 0, cashback_balance: 0, pending_reward_coupon: null },
        };
        setCurrentUser(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    // Buscar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user as any);
      } else {
        setIsLoading(false);
      }
      // Marca como carregado após processar sessão inicial
      isInitialLoad = false;
    });

    // Subscription só reage a mudanças APÓS o load inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Evitar fetch duplicado durante o load inicial
      if (isInitialLoad) return;

      if (session) {
        const userId = session.user.id;
        const previousUserId = previousUserIdRef.current;

        // Se o usuário acabou de fazer login (mudou de null para um userId)
        if (!previousUserId && userId) {
          // Tentar fazer merge do carrinho anônimo com o carrinho do usuário
          try {
            const STORAGE_KEY = 'auricapri_cart_session_id';
            const sessionId = localStorage.getItem(STORAGE_KEY);

            if (sessionId) {
              await cartApi.mergeCart(sessionId);
              // Limpar sessionId após merge bem-sucedido
              localStorage.removeItem(STORAGE_KEY);
              // Disparar evento para notificar que o carrinho foi mergeado
              window.dispatchEvent(new CustomEvent('cart-merged'));
            }
          } catch (error) {
            logger.error('Error merging cart on login', error, { context: 'useAuth' });
            // Não bloquear o login se o merge falhar
          }
        }

        previousUserIdRef.current = userId;
        fetchProfile(session.user as any);
      } else {
        previousUserIdRef.current = null;
        setCurrentUser(null);
        setIsLoading(false);
      }
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
      const { session, profile } = await authApi.signIn({ email, password });
      if (session && profile) {
        setCurrentUser(profile);
        return { success: true };
      }
      return { success: false, error: 'No session returned' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      const { user, session } = await authApi.signUp({ email, password, metadata });
      if (session && user) {
        const profile = await usersApi.getProfile(user.id);
        setCurrentUser(profile);
        return { success: true };
      }
      return { success: false, error: 'No session returned' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
      await supabase.auth.signOut();
      setCurrentUser(null);
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
    signOut
  };
};
