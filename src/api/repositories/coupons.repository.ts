import { supabase } from '../../utils/supabase';
import { Coupon } from '../../types';

export class CouponsRepository {
  async getAllActive(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .order('code');
    
    if (error) throw error;
    return (data || []) as Coupon[];
  }

  async getAll(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('code');
    
    if (error) throw error;
    return (data || []) as Coupon[];
  }

  async getByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
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
}

