import { supabase } from '../config/supabase.js';

export interface Return {
  id: string;
  order_id: string;
  status: string;
  reason: string | null;
  rma_code: string | null;
  refund_amount: number;
  metadata: any;
  created_at: string;
}

export class ReturnsRepository {
  async create(data: {
    order_id: string;
    status?: string;
    reason?: string | null;
    rma_code?: string | null;
    refund_amount?: number;
    metadata?: any;
  }): Promise<Return> {
    // Generate RMA code if not provided
    const rmaCode = data.rma_code || `RMA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: returnRecord, error } = await supabase
      .from('returns')
      .insert({
        ...data,
        status: data.status || 'requested',
        rma_code: rmaCode,
        refund_amount: data.refund_amount || 0
      })
      .select()
      .single();

    if (error) throw error;
    return returnRecord as Return;
  }

  async getByOrderId(orderId: string): Promise<Return[]> {
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Return[];
  }

  async getByUserId(userId: string): Promise<Return[]> {
    const { data, error } = await supabase
      .from('returns')
      .select('*, orders!inner(user_id)')
      .eq('orders.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Return[];
  }

  async update(id: string, updates: Partial<Return>): Promise<Return> {
    const { data, error } = await supabase
      .from('returns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Return;
  }
}

