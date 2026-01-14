import { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../utils/supabase';
import { UsersApi } from '../api/users.api';
import { AuthApi } from '../api/auth.api';
import { CartApi } from '../api/cart.api';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        console.error('OAuth error:', error, errorDescription);
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
            console.error('Error setting session from OAuth hash:', sessionError);
          }

          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (error) {
          console.error('Error processing OAuth hash:', error);
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };

    processOAuthHash();
  }, []);

  useEffect(() => {
    const fetchProfile = async (user: { id: string; email?: string | null; user_metadata?: Record<string, any> }) => {
      try {
        const profile = await usersApi.getProfile(user.id);
        if (!profile) throw new Error('Profile not found');
        setCurrentUser(profile);
      } catch (err) {
        console.error('Error fetching profile:', err);
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user as any);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
            }
          } catch (error) {
            console.error('Error merging cart on login:', error);
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
    signIn,
    signUp,
    signOut
  };
};
