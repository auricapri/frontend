import { supabase } from '../config/supabase.js';

export interface Payment {
  id: string;
  order_id: string;
  provider_code: string | null;
  provider_payment_id: string | null;
  status: string;
  attempt_number: number;
  amount: number;
  currency: string;
  created_at: string;
}

export class PaymentsRepository {
  async create(data: {
    order_id: string;
    provider_code?: string | null;
    provider_payment_id?: string | null;
    status?: string;
    attempt_number?: number;
    amount: number;
    currency?: string;
    metadata?: any;
  }): Promise<Payment> {
    // Remove metadata if it doesn't exist in the table schema
    const { metadata, ...paymentData } = data;
    
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        ...paymentData,
        status: paymentData.status || 'pending',
        attempt_number: paymentData.attempt_number || 1,
        currency: paymentData.currency || 'BRL'
      })
      .select()
      .single();

    if (error) throw error;
    return payment as Payment;
  }

  async getByOrderId(orderId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Payment[];
  }

  async update(id: string, updates: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Payment;
  }
}

