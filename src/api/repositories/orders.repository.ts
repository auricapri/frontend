import { supabase } from '../../utils/supabase';
import { Order, AddressData, InternalLogisticsInfo } from '../../types';

export class OrdersRepository {
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Map database fields to app structure
    return (data || []).map((o: any) => ({
      ...o,
      total: o.total_amount || o.total || 0,
      items: o.items || []
    })) as Order[];
  }

  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    return {
      ...data,
      total: data.total_amount || data.total || 0,
      items: data.items || []
    } as Order;
  }

  async getByUserId(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map((o: any) => ({
      ...o,
      total: o.total_amount || o.total || 0,
      items: o.items || []
    })) as Order[];
  }

  async create(order: {
    user_id?: string;
    items: any[];
    subtotal: number;
    total_amount: number;
    discount_amount: number;
    shipping_cost: number;
    tax_amount: number;
    status: string;
    payment_method: 'credit_card' | 'pix';
    shipping_address_snapshot: AddressData;
    internal_logistics: InternalLogisticsInfo;
  }): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      ...data,
      total: data.total_amount || data.total || 0,
      items: data.items || []
    } as Order;
  }

  async updateStatus(id: string, status: string, trackingCode?: string): Promise<Order> {
    const updates: any = { status };
    if (trackingCode) updates.tracking_code = trackingCode;
    
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      ...data,
      total: data.total_amount || data.total || 0,
      items: data.items || []
    } as Order;
  }
}

