import { supabase } from '../config/supabase.js';

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  metadata: any;
  created_at: string;
}

export class OrderStatusHistoryRepository {
  async create(data: {
    order_id: string;
    old_status: string | null;
    new_status: string;
    changed_by?: string | null;
    metadata?: any;
  }): Promise<OrderStatusHistory> {
    const { data: history, error } = await supabase
      .from('order_status_history')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return history as OrderStatusHistory;
  }

  async getByOrderId(orderId: string): Promise<OrderStatusHistory[]> {
    const { data, error } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as OrderStatusHistory[];
  }
}

