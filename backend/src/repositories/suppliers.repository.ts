import { supabase } from '../config/supabase.js';
import type { Supplier, SupplierReview } from '../../shared/types/index.js';

export type { Supplier, SupplierReview };

export class SuppliersRepository {
  async getAll(options?: { limit?: number; offset?: number }): Promise<Supplier[]> {
    const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
    const offset = Math.max(options?.offset || 0, 0);
    
    const query = supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as Supplier[];
  }

  async getAllActive(options?: { limit?: number; offset?: number }): Promise<Supplier[]> {
    const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
    const offset = Math.max(options?.offset || 0, 0);
    
    const query = supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as Supplier[];
  }

  async getById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Supplier | null;
  }

  async getByIds(ids: string[]): Promise<Supplier[]> {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .in('id', ids);

    if (error) throw error;
    return (data || []) as Supplier[];
  }

  async create(supplier: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();
    
    if (error) throw error;
    return data as Supplier;
  }

  async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Supplier;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async getReviews(supplierId: string): Promise<SupplierReview[]> {
    const { data, error } = await supabase
      .from('supplier_reviews')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    if (!data || data.length === 0) return [];

    interface ReviewRow {
      id: string;
      supplier_id: string;
      user_id: string;
      [key: string]: unknown;
    }

    interface ProfileRow {
      id: string;
      full_name?: string;
      email?: string;
    }

    const userIds = [...new Set(data.map((r: ReviewRow) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const profilesMap = new Map<string, ProfileRow>();
    if (profiles) {
      profiles.forEach((p: ProfileRow) => {
        profilesMap.set(p.id, p);
      });
    }

    return data.map((r: ReviewRow) => {
      const profile = profilesMap.get(r.user_id);
      const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Usuário';
      return {
        id: r.id,
        supplier_id: r.supplier_id,
        user_id: r.user_id,
        user_name: userName,
        rating: r.rating,
        comment: r.comment,
        helpful_count: r.helpful_count || 0,
        created_at: r.created_at,
        updated_at: r.updated_at
      } as SupplierReview;
    });
  }

  async createReview(review: {
    supplier_id: string;
    user_id: string;
    rating: number;
    comment?: string | null;
  }): Promise<SupplierReview> {
    const { data, error } = await supabase
      .from('supplier_reviews')
      .insert(review)
      .select()
      .single();
    
    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', review.user_id)
      .single();

    const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Usuário';

    return {
      id: data.id,
      supplier_id: data.supplier_id,
      user_id: data.user_id,
      user_name: userName,
      rating: data.rating,
      comment: data.comment,
      helpful_count: data.helpful_count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as SupplierReview;
  }

  async updateReview(id: string, updates: {
    rating?: number;
    comment?: string | null;
  }): Promise<SupplierReview> {
    const { data, error } = await supabase
      .from('supplier_reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', data.user_id)
      .single();

    const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Usuário';

    return {
      id: data.id,
      supplier_id: data.supplier_id,
      user_id: data.user_id,
      user_name: userName,
      rating: data.rating,
      comment: data.comment,
      helpful_count: data.helpful_count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as SupplierReview;
  }

  async toggleHelpful(reviewId: string, userId: string): Promise<{ helpful_count: number; user_has_helped: boolean }> {
    const { data: existing } = await supabase
      .from('supplier_review_helpful')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('supplier_review_helpful')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('supplier_review_helpful')
        .insert({ review_id: reviewId, user_id: userId });
    }

    const { count, error: countError } = await supabase
      .from('supplier_review_helpful')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId);

    if (countError) {
      throw countError;
    }

    const helpful_count = count || 0;

    await supabase
      .from('supplier_reviews')
      .update({ helpful_count })
      .eq('id', reviewId);

    return {
      helpful_count,
      user_has_helped: !existing
    };
  }
}
