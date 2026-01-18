import { supabase } from '../config/supabase.js';
import { OrderReview, OrderReviewMedia } from '../types/order-review.types.js';

export class OrderReviewsRepository {
  async getByOrderId(orderId: string): Promise<OrderReview[]> {
    const { data, error } = await supabase
      .from('order_reviews')
      .select(`
        *,
        order_review_media (*)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapReview);
  }

  async getByUserId(userId: string): Promise<OrderReview[]> {
    const { data, error } = await supabase
      .from('order_reviews')
      .select(`
        *,
        order_review_media (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapReview);
  }

  async getByOrderIdAndUserId(orderId: string, userId: string): Promise<OrderReview | null> {
    const { data, error } = await supabase
      .from('order_reviews')
      .select(`
        *,
        order_review_media (*)
      `)
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapReview(data) : null;
  }

  async getById(id: string): Promise<OrderReview | null> {
    const { data, error } = await supabase
      .from('order_reviews')
      .select(`
        *,
        order_review_media (*)
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
    user_id: string;
    rating: number;
    comment?: string | null;
  }): Promise<OrderReview> {
    const { data, error } = await supabase
      .from('order_reviews')
      .insert(review)
      .select(`
        *,
        order_review_media (*)
      `)
      .single();

    if (error) throw error;

    return this.mapReview(data);
  }

  async update(id: string, updates: {
    rating?: number;
    comment?: string | null;
    cashback_awarded?: boolean;
  }): Promise<OrderReview> {
    const { data, error } = await supabase
      .from('order_reviews')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        order_review_media (*)
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
  }): Promise<OrderReviewMedia> {
    const { data, error } = await supabase
      .from('order_review_media')
      .insert({
        review_id: reviewId,
        ...media
      })
      .select()
      .single();

    if (error) throw error;

    return data as OrderReviewMedia;
  }

  async removeMedia(mediaId: string): Promise<void> {
    const { error } = await supabase
      .from('order_review_media')
      .delete()
      .eq('id', mediaId);

    if (error) throw error;
  }

  async toggleHelpful(reviewId: string, userId: string): Promise<{ helpful_count: number; user_has_helped: boolean }> {
    const { data: existing } = await supabase
      .from('order_review_helpful')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('order_review_helpful')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('order_review_helpful')
        .insert({ review_id: reviewId, user_id: userId });
    }

    const { count, error: countError } = await supabase
      .from('order_review_helpful')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId);

    if (countError) {
      throw countError;
    }

    const helpful_count = count || 0;

    await supabase
      .from('order_reviews')
      .update({ helpful_count })
      .eq('id', reviewId);

    return {
      helpful_count,
      user_has_helped: !existing
    };
  }

  async getUserHasHelped(reviewId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('order_review_helpful')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    return !!data;
  }

  private mapReview(data: any): OrderReview {
    return {
      id: data.id,
      order_id: data.order_id,
      user_id: data.user_id,
      rating: data.rating,
      comment: data.comment,
      helpful_count: data.helpful_count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      media: (data.order_review_media || []).map((m: any) => ({
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

