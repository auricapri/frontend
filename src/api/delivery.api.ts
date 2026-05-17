import { apiClient } from './client';
import { type Order, type OrderItem } from '../types';
import { type Supplier } from '../types/suppliers';

export interface DeliveryOrderItem {
  order_id: string;
  order_item: OrderItem;
  order_item_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
  picked_up: boolean;
  pickup_id?: string;
}

export interface DeliverySupplierGroup {
  supplier_id: string;
  supplier: Supplier;
  orders: Order[];
  items: DeliveryOrderItem[];
  total_amount: number;
  total_items: number;
  picked_up_items: number;
}

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

export class DeliveryApi {
  async getOrdersForDelivery(date?: string): Promise<DeliverySupplierGroup[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiClient.get<DeliverySupplierGroup[]>(`/delivery/orders${query}`);
  }

  async markItemPickedUp(orderId: string, orderItemId: string): Promise<DeliveryPickup> {
    return apiClient.post<DeliveryPickup>('/delivery/pickups', { orderId, orderItemId });
  }

  async markAllSupplierItemsPickedUp(supplierId: string): Promise<{ success: number; failed: number; errors: string[] }> {
    return apiClient.post<{ success: number; failed: number; errors: string[] }>(`/delivery/pickups/supplier/${supplierId}`, {});
  }

  async getPickups(): Promise<DeliveryPickup[]> {
    return apiClient.get<DeliveryPickup[]>('/delivery/pickups');
  }

  async getReports(): Promise<DeliveryReport[]> {
    return apiClient.get<DeliveryReport[]>('/delivery/reports');
  }

  async uploadMedia(params: { base64: string; fileName: string; contentType?: string }): Promise<{ url: string; path: string }> {
    return apiClient.post<{ url: string; path: string }>('/delivery/upload-media', {
      file: params.base64,
      fileName: params.fileName,
      contentType: params.contentType,
    });
  }

  async reportProblem(params: {
    orderId: string;
    orderItemId: string;
    mediaUrls: string[];
    description?: string;
  }): Promise<DeliveryReport> {
    return apiClient.post<DeliveryReport>('/delivery/reports', params);
  }

  // =============================================
  // LOGISTICS WORKFLOW METHODS
  // =============================================

  /**
   * Get delivery dashboard with orders grouped by status
   */
  async getDeliveryDashboard(): Promise<{
    awaiting_pickup: Order[];
    collected: Order[];
    counts: {
      awaiting_pickup: number;
      collected: number;
    };
  }> {
    return apiClient.get('/delivery/dashboard');
  }

  /**
   * Get orders awaiting pickup by delivery team
   * Status: AWAITING_PICKUP
   */
  async getAwaitingPickupOrders(limit = 50, offset = 0): Promise<Order[]> {
    return apiClient.get<Order[]>(`/delivery/orders/awaiting-pickup?limit=${limit}&offset=${offset}`);
  }

  /**
   * Get orders that have been collected (in transit to expedition)
   * Status: COLLECTED
   */
  async getCollectedOrders(limit = 50, offset = 0): Promise<Order[]> {
    return apiClient.get<Order[]>(`/delivery/orders/collected?limit=${limit}&offset=${offset}`);
  }

  /**
   * Mark order as collected by delivery team
   * Transitions: AWAITING_PICKUP -> COLLECTED
   */
  async markAsCollected(orderId: string): Promise<Order> {
    return apiClient.put<Order>(`/delivery/orders/${orderId}/collected`, {});
  }

  /**
   * Move order to expedition (processing)
   * Transitions: COLLECTED -> PROCESSING
   * Note: Admin only
   */
  async moveToExpedition(orderId: string): Promise<Order> {
    return apiClient.put<Order>(`/delivery/orders/${orderId}/expedition`, {});
  }
}

