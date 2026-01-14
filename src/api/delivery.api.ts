import { apiClient } from './client';
import { type Order, type Supplier } from '../types';

export interface DeliveryOrderItem {
  order_id: string;
  order_item: any;
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
}

