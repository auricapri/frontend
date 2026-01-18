import { supabase } from '../config/supabase.js';
import type { CartItem } from '../../shared/types/index.js';
import logger from '../config/logger.js';

export interface CartSession {
  id: string;
  session_key: string;
  user_id?: string | null;
  items: CartItem[];
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
}

export class CartRepository {
  async getCart(sessionKey: string): Promise<CartSession | null> {
    const { data, error } = await supabase
      .from('cart_sessions')
      .select('*')
      .eq('session_key', sessionKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      if (error.code === 'PGRST205') {
        logger.warn('Cart table missing in schema cache', { sessionKey });
        return null;
      }
      logger.error('Error fetching cart from database', { error, sessionKey });
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      session_key: data.session_key,
      user_id: data.user_id,
      items: (data.items || []) as CartItem[],
      created_at: data.created_at,
      updated_at: data.updated_at,
      expires_at: data.expires_at,
    };
  }

  async saveCart(sessionKey: string, items: CartItem[], userId?: string): Promise<CartSession> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabase
      .from('cart_sessions')
      .upsert(
        {
          session_key: sessionKey,
          user_id: userId || null,
          items,
          expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: 'session_key',
        }
      )
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205') {
        logger.warn('Cart table missing in schema cache', { sessionKey });
        return {
          id: '',
          session_key: sessionKey,
          user_id: userId || null,
          items,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        };
      }
      logger.error('Error saving cart to database', { error, sessionKey });
      throw error;
    }

    return {
      id: data.id,
      session_key: data.session_key,
      user_id: data.user_id,
      items: (data.items || []) as CartItem[],
      created_at: data.created_at,
      updated_at: data.updated_at,
      expires_at: data.expires_at,
    };
  }

  async deleteCart(sessionKey: string): Promise<void> {
    const { error } = await supabase
      .from('cart_sessions')
      .delete()
      .eq('session_key', sessionKey);

    if (error) {
      if (error.code === 'PGRST205') {
        logger.warn('Cart table missing in schema cache', { sessionKey });
        return;
      }
      logger.error('Error deleting cart from database', { error, sessionKey });
      throw error;
    }
  }

  async getCartByUserId(userId: string): Promise<CartSession | null> {
    const sessionKey = `user:${userId}`;
    return this.getCart(sessionKey);
  }

  async cleanupExpiredCarts(): Promise<number> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('cart_sessions')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (error) {
      if (error.code === 'PGRST205') {
        logger.warn('Cart table missing in schema cache');
        return 0;
      }
      logger.error('Error cleaning up expired carts', { error });
      throw error;
    }

    const deletedCount = data?.length || 0;
    if (deletedCount > 0) {
      logger.info('Cleaned up expired carts', { count: deletedCount });
    }

    return deletedCount;
  }
}
