import { supabase } from '../config/supabase.js';
import { ProductReview, ProductReviewMedia } from '../types/product-review.types.js';

export class ProductReviewsRepository {
  async getByOrderId(orderId: string): Promise<ProductReview[]> {
    const { data, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        product_review_media (*)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapReview);
  }

  async getByProductId(productId: string): Promise<ProductReview[]> {
    const { data, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        product_review_media (*)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) return [];

    const userIds = [...new Set(data.map((r: any) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const profilesMap = new Map();
    if (profiles) {
      profiles.forEach((p: any) => {
        profilesMap.set(p.id, p);
      });
    }

    return data.map((r: any) => {
      const profile = profilesMap.get(r.user_id);
      return this.mapReview({ ...r, profiles: profile });
    });
  }

  async getByOrderItemId(orderId: string, orderItemId: string, userId: string): Promise<ProductReview | null> {
    const { data, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        product_review_media (*)
      `)
      .eq('order_id', orderId)
      .eq('order_item_id', orderItemId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapReview(data) : null;
  }

  async getById(id: string): Promise<ProductReview | null> {
    const { data, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        product_review_media (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapReview(data) : null;
  }

  async create(review: {
    order_id: string;
    order_item_id: string;
    product_id: string;
    variant_id?: string;
    user_id: string;
    rating: number;
    comment?: string | null;
    variant_size?: string;
    variant_color?: string;
  }): Promise<ProductReview> {
    const { data, error } = await supabase
      .from('product_reviews')
      .insert(review)
      .select(`
        *,
        product_review_media (*)
      `)
      .single();

    if (error) throw error;

    return this.mapReview(data);
  }

  async update(id: string, updates: {
    rating?: number;
    comment?: string | null;
  }): Promise<ProductReview> {
    const { data, error } = await supabase
      .from('product_reviews')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        product_review_media (*)
      `)
      .single();

    if (error) throw error;

    return this.mapReview(data);
  }

  async addMedia(reviewId: string, media: {
    media_url: string;
    media_type: 'image' | 'video';
    file_size: number;
    file_name: string;
  }): Promise<ProductReviewMedia> {
    const { data, error } = await supabase
      .from('product_review_media')
      .insert({
        review_id: reviewId,
        ...media
      })
      .select()
      .single();

    if (error) throw error;

    return data as ProductReviewMedia;
  }

  async removeMedia(mediaId: string): Promise<void> {
    const { error } = await supabase
      .from('product_review_media')
      .delete()
      .eq('id', mediaId);

    if (error) throw error;
  }

  async toggleHelpful(reviewId: string, userId: string): Promise<{ helpful_count: number; user_has_helped: boolean }> {
    const { data: existing } = await supabase
      .from('product_review_helpful')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('product_review_helpful')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('product_review_helpful')
        .insert({ review_id: reviewId, user_id: userId });
    }

    const { count, error: countError } = await supabase
      .from('product_review_helpful')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId);

    if (countError) {
      throw countError;
    }

    const helpful_count = count || 0;

    await supabase
      .from('product_reviews')
      .update({ helpful_count })
      .eq('id', reviewId);

    return {
      helpful_count,
      user_has_helped: !existing
    };
  }

  async getUserHasHelped(reviewId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('product_review_helpful')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    return !!data;
  }

  private mapReview(data: any): ProductReview {
    const profile = data.profiles || (typeof data.profiles === 'object' && !Array.isArray(data.profiles) ? data.profiles : null);
    const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Usuário';
    
    return {
      id: data.id,
      order_id: data.order_id,
      order_item_id: data.order_item_id,
      product_id: data.product_id,
      variant_id: data.variant_id,
      user_id: data.user_id,
      user_name: userName,
      rating: data.rating,
      comment: data.comment,
      helpful_count: data.helpful_count || 0,
      cashback_awarded: data.cashback_awarded || false,
      variant_size: data.variant_size,
      variant_color: data.variant_color,
      created_at: data.created_at,
      updated_at: data.updated_at,
      media: (data.product_review_media || []).map((m: any) => ({
        id: m.id,
        review_id: m.review_id,
        media_url: m.media_url,
        media_type: m.media_type,
        file_size: m.file_size,
        file_name: m.file_name,
        created_at: m.created_at
      }))
    };
  }
}

