import { supabase } from '../config/supabase.js';

export interface Shipment {
  id: string;
  order_id: string;
  provider: string | null;
  tracking_code: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
  metadata: any;
  created_at: string;
}

export class ShipmentsRepository {
  async create(data: {
    order_id: string;
    provider?: string | null;
    tracking_code?: string | null;
    status?: string;
    shipped_at?: string | null;
    delivered_at?: string | null;
    metadata?: any;
  }): Promise<Shipment> {
    const { data: shipment, error } = await supabase
      .from('shipments')
      .insert({
        ...data,
        status: data.status || 'label_created'
      })
      .select()
      .single();

    if (error) throw error;
    return shipment as Shipment;
  }

  async getByOrderId(orderId: string): Promise<Shipment[]> {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Shipment[];
  }

  async update(id: string, updates: Partial<Shipment>): Promise<Shipment> {
    const { data, error } = await supabase
      .from('shipments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Shipment;
  }
}

