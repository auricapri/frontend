import { supabase } from '../config/supabase.js';

export interface DeliveryPickup {
  id: string;
  order_id: string;
  order_item_id: string;
  product_id: string;
  supplier_id: string | null;
  picked_up_at: string | null;
  picked_up_by: string;
  status: 'pending' | 'picked_up' | 'problem_reported';
  created_at: string;
  updated_at: string;
}

export interface DeliveryReport {
  id: string;
  order_id: string;
  order_item_id: string;
  supplier_id: string | null;
  reported_by: string;
  reported_at: string;
  description: string | null;
  media_urls: string[];
  status: 'pending' | 'resolved';
  created_at: string;
  updated_at: string;
}

export class DeliveryRepository {
  async createPickup(pickup: {
    order_id: string;
    order_item_id: string;
    product_id: string;
    supplier_id: string | null;
    picked_up_by: string;
  }): Promise<DeliveryPickup> {
    const { data, error } = await supabase
      .from('delivery_pickups')
      .insert({
        ...pickup,
        picked_up_at: new Date().toISOString(),
        status: 'picked_up'
      })
      .select()
      .single();

    if (error) throw error;
    return data as DeliveryPickup;
  }

  async getPickupByOrderItem(orderId: string, orderItemId: string, userId: string): Promise<DeliveryPickup | null> {
    const { data, error } = await supabase
      .from('delivery_pickups')
      .select('*')
      .eq('order_id', orderId)
      .eq('order_item_id', orderItemId)
      .eq('picked_up_by', userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as DeliveryPickup | null;
  }

  async getPickupsBySupplier(supplierId: string, userId?: string): Promise<DeliveryPickup[]> {
    let query = supabase
      .from('delivery_pickups')
      .select('*')
      .eq('supplier_id', supplierId);

    if (userId) {
      query = query.eq('picked_up_by', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as DeliveryPickup[];
  }

  async getPickupsByUser(userId: string): Promise<DeliveryPickup[]> {
    const { data, error } = await supabase
      .from('delivery_pickups')
      .select('*')
      .eq('picked_up_by', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DeliveryPickup[];
  }

  async createReport(report: {
    order_id: string;
    order_item_id: string;
    supplier_id: string | null;
    reported_by: string;
    description: string | null;
    media_urls: string[];
  }): Promise<DeliveryReport> {
    const { data, error } = await supabase
      .from('delivery_reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    return data as DeliveryReport;
  }

  async getReportsByUser(userId: string): Promise<DeliveryReport[]> {
    const { data, error } = await supabase
      .from('delivery_reports')
      .select('*')
      .eq('reported_by', userId)
      .order('reported_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DeliveryReport[];
  }

  async updatePickupStatus(id: string, status: 'picked_up' | 'problem_reported'): Promise<DeliveryPickup> {
    const updates: any = { status };
    if (status === 'picked_up') {
      updates.picked_up_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('delivery_pickups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DeliveryPickup;
  }

  async deletePickup(id: string): Promise<void> {
    const { error } = await supabase
      .from('delivery_pickups')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
