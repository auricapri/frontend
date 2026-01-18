import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';

export interface WishlistItem {
  id?: string;
  user_id: string;
  product_id: string;
  share_slug?: string | null;
  created_at?: string;
}

export class WishlistRepository {
  async getByUserId(userId: string): Promise<WishlistItem[]> {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return (data || []) as WishlistItem[];
  }

  async getProductIds(userId: string): Promise<string[]> {
    const items = await this.getByUserId(userId);
    return items.map(item => item.product_id);
  }

  async add(userId: string, productId: string): Promise<WishlistItem> {
    const { data, error } = await supabase
      .from('wishlist')
      .insert({ user_id: userId, product_id: productId })
      .select()
      .single();
    
    if (error) throw error;
    return data as WishlistItem;
  }

  async remove(userId: string, productId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    
    if (error) throw error;
  }

  async isWishlisted(userId: string, productId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  }

  async getByShareSlug(slug: string): Promise<{ user_id: string; product_ids: string[] } | null> {
    // Get first wishlist item with this share_slug to find the user
    const { data, error } = await supabase
      .from('wishlist')
      .select('user_id, product_id')
      .eq('share_slug', slug)
      .limit(1)
      .maybeSingle();
    
    if (error) {
      logger.error('Error fetching wishlist by slug', { error: error.message, slug });
      throw error;
    }

    if (!data) {
      logger.debug('No wishlist found with slug', { slug });
      return null;
    }

    const userId = data.user_id;
    
    // Get all product IDs for this user (they all share the same slug)
    const { data: allItems, error: itemsError } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', userId);
    
    if (itemsError) {
      logger.error('Error fetching user wishlist items', { error: itemsError.message, userId });
      throw itemsError;
    }

    if (!allItems || allItems.length === 0) {
      logger.debug('User has no wishlist items', { userId });
      return null;
    }
    
    return {
      user_id: userId,
      product_ids: allItems.map(item => item.product_id)
    };
  }

  async generateShareSlug(userId: string): Promise<string> {
    // Check if user already has a share slug
    const { data: existing, error: checkError } = await supabase
      .from('wishlist')
      .select('share_slug')
      .eq('user_id', userId)
      .not('share_slug', 'is', null)
      .limit(1)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (existing?.share_slug) {
      return existing.share_slug;
    }

    // Generate new unique slug
    let slug: string = '';
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      slug = `gift-${Math.random().toString(36).substring(2, 9)}`;
      
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('share_slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) {
        isUnique = true;
      } else {
        attempts++;
      }
    }
    
    if (!isUnique || !slug) {
      throw new Error('Failed to generate unique share slug');
    }

    // Update all wishlist items for this user with the new slug
    const { error: updateError } = await supabase
      .from('wishlist')
      .update({ share_slug: slug })
      .eq('user_id', userId);
    
    if (updateError) throw updateError;
    
    return slug;
  }
}

