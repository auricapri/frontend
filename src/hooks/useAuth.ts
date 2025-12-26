import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../utils/supabase';
import { UsersApi } from '../api/users.api';
import { AuthApi } from '../api/auth.api';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const usersApi = new UsersApi();
  const authApi = new AuthApi();

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      try {
        const profile = await usersApi.getProfile(userId);
        setCurrentUser(profile);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { user, session, profile } = await authApi.signIn({ email, password });
      if (session && profile) {
        setCurrentUser(profile);
        return { success: true };
      }
      return { success: false, error: 'No session returned' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      const { user, session } = await authApi.signUp({ email, password, metadata });
      if (session && user) {
        const profile = await usersApi.getProfile(user.id);
        setCurrentUser(profile);
        return { success: true };
      }
      return { success: false, error: 'No session returned' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
      await supabase.auth.signOut();
      setCurrentUser(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
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

