import { supabase } from '../config/supabase.js';
import type { Order, AddressData, InternalLogisticsInfo, OrderItem } from '../../shared/types/index.js';

export type { Order, AddressData, InternalLogisticsInfo };

const ORDER_SELECT_FIELDS = 'id, user_id, created_at, status, total_amount, subtotal, discount_amount, shipping_cost, tax_amount, payment_method, items, tracking_code, internal_logistics, shipping_address_snapshot, gift_from_user_id, client_ip, coupon_id';

interface OrderRow {
  id: string;
  user_id?: string | null;
  created_at: string;
  status: string;
  total_amount?: number;
  total?: number;
  items?: OrderItem[];
  [key: string]: unknown;
}

export class OrdersRepository {
  async getAll(options?: { limit?: number; offset?: number }): Promise<Order[]> {
    const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
    const offset = Math.max(options?.offset || 0, 0);
    
    const query = supabase
      .from('orders')
      .select(ORDER_SELECT_FIELDS)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map((o: OrderRow) => ({
      ...o,
      total: o.total_amount || o.total || 0,
      items: o.items || []
    })) as Order[];
  }

  async getByCreatedAtRange(params: { start: Date; end: Date; status?: string }): Promise<Order[]> {
    let query = supabase
      .from('orders')
      .select(ORDER_SELECT_FIELDS)
      .gte('created_at', params.start.toISOString())
      .lte('created_at', params.end.toISOString())
      .order('created_at', { ascending: false });

    if (params.status) {
      query = query.eq('status', params.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((o: OrderRow) => ({
      ...o,
      total: o.total_amount || o.total || 0,
      items: o.items || [],
    })) as Order[];
  }

  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT_FIELDS)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    const orderRow = data as OrderRow;
    return {
      ...orderRow,
      total: orderRow.total_amount || (orderRow as { total?: number }).total || 0,
      items: orderRow.items || []
    } as Order;
  }

  async getByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<Order[]> {
    const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
    const offset = Math.max(options?.offset || 0, 0);
    
    const query = supabase
      .from('orders')
      .select(ORDER_SELECT_FIELDS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map((o: OrderRow) => ({
      ...o,
      total: o.total_amount || o.total || 0,
      items: o.items || []
    })) as Order[];
  }

  async create(order: {
    user_id?: string;
    gift_from_user_id?: string | null;
    wishlist_slug?: string | null;
    items: OrderItem[];
    subtotal: number;
    total_amount: number;
    discount_amount: number;
    shipping_cost: number;
    tax_amount: number;
    status: string;
    payment_method: 'credit_card' | 'pix' | 'boleto';
    shipping_address_snapshot: AddressData;
    internal_logistics: InternalLogisticsInfo;
    client_ip?: string | null;
    coupon_id?: string | null;
  }): Promise<Order> {
    const insertOnce = async (payload: unknown) => {
      return supabase.from('orders').insert(payload).select(ORDER_SELECT_FIELDS).single();
    };

    let { data, error } = await insertOnce(order);

    if (error && error instanceof Error && error.message.includes('wishlist_slug')) {
      const { wishlist_slug: _wishlistSlug, ...fallbackPayload } = order;
      const retry = await insertOnce(fallbackPayload);
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    if (!data) {
      throw new Error('Order not found after creation');
    }
    
    const orderRow = data as OrderRow;
    return {
      ...orderRow,
      total: orderRow.total_amount || (orderRow as { total?: number }).total || 0,
      items: orderRow.items || []
    } as Order;
  }

  async updateStatus(id: string, status: string, trackingCode?: string, oldStatus?: string): Promise<Order> {
    // Get current status if not provided
    if (!oldStatus) {
      const current = await this.getById(id);
      oldStatus = current?.status || undefined;
    }

    const updates: { status: string; tracking_code?: string } = { status };
    if (trackingCode) updates.tracking_code = trackingCode;
    
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select(ORDER_SELECT_FIELDS)
      .single();
    
    if (error) throw error;
    if (!data) {
      throw new Error('Order not found after update');
    }
    
    const orderRow = data as OrderRow;
    return {
      ...orderRow,
      total: orderRow.total_amount || (orderRow as { total?: number }).total || 0,
      items: orderRow.items || []
    } as Order;
  }
}

let singleton: OrdersRepository | null = null;
export function getOrdersRepository(): OrdersRepository {
  if (!singleton) singleton = new OrdersRepository();
  return singleton;
}
