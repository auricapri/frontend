import { supabase } from '../config/supabase.js';

export interface Coupon {
  id?: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  is_public: boolean;              // Se false, não aparece na listagem pública
  first_purchase_only: boolean;    // Se true, válido apenas para primeira compra
  usage_limit?: number | null;     // Limite total de usos (null = ilimitado)
  per_user_limit: number;          // Limite de uso por usuário (default 1)
  used_count: number;              // Contador de usos
  min_purchase_amount?: number;
  expires_at?: string;
  product_ids?: string[];
  created_at?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface CouponUsage {
  id?: string;
  coupon_id: string;
  user_id?: string | null;
  order_id?: string | null;
  used_at?: string;
}

export class CouponsRepository {
  /**
   * Retorna apenas cupons ativos E públicos (para listagem pública)
   */
  async getAllActive(options?: { limit?: number; offset?: number }): Promise<Coupon[]> {
    const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
    const offset = Math.max(options?.offset || 0, 0);

    const query = supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)  // Apenas cupons públicos
      .is('deleted_at', null)
      .order('code')
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as Coupon[];
  }

  async getAll(options?: { limit?: number; offset?: number }): Promise<Coupon[]> {
    const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
    const offset = Math.max(options?.offset || 0, 0);
    
    const query = supabase
      .from('coupons')
      .select('*')
      .is('deleted_at', null)
      .order('code')
      .range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as Coupon[];
  }

  async getById(id: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) throw error;
    return data as Coupon | null;
  }

  async getByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();
    
    if (error) throw error;
    return data as Coupon | null;
  }

  async create(coupon: Partial<Coupon>): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .insert(coupon)
      .select()
      .single();
    
    if (error) throw error;
    return data as Coupon;
  }

  async update(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Coupon;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Incrementa o contador de uso do cupom
   */
  async incrementUsage(couponId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_coupon_usage', {
      coupon_id_param: couponId
    });

    // Se RPC não existir, fazer update manual
    if (error) {
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ used_count: supabase.rpc('coalesce', { val: 'used_count', default_val: 0 }) })
        .eq('id', couponId);

      // Fallback: incrementar direto
      if (updateError) {
        const coupon = await this.getById(couponId);
        if (coupon) {
          await supabase
            .from('coupons')
            .update({ used_count: (coupon.used_count || 0) + 1 })
            .eq('id', couponId);
        }
      }
    }
  }

  /**
   * Registra uso do cupom por um usuário/pedido
   */
  async recordUsage(couponId: string, userId?: string, orderId?: string): Promise<CouponUsage | null> {
    const { data, error } = await supabase
      .from('coupon_usage')
      .insert({
        coupon_id: couponId,
        user_id: userId || null,
        order_id: orderId || null
      })
      .select()
      .single();

    if (error) {
      // Ignorar erro de duplicata (constraint unique)
      if (error.code === '23505') return null;
      throw error;
    }

    // Incrementar contador de uso
    await this.incrementUsage(couponId);

    return data as CouponUsage;
  }

  /**
   * Conta quantas vezes um usuário usou um cupom
   */
  async getUserUsageCount(couponId: string, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('coupon_usage')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', couponId)
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Verifica se usuário já fez alguma compra (para cupom first_purchase_only)
   */
  async hasUserPurchasedBefore(userId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['confirmed', 'processing', 'shipped', 'delivered']);

    if (error) throw error;
    return (count || 0) > 0;
  }
}
