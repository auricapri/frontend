import { apiClient } from './client';

export interface Shipment {
  id: string;
  order_id: string;
  provider: string | null;
  tracking_code: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
  metadata: any; // allow: pragmatic any
  created_at: string;
}

export class ShipmentsApi {
  async getByOrderId(orderId: string): Promise<Shipment[]> {
    return apiClient.get<Shipment[]>(`/shipments/order/${orderId}`);
  }

  async update(id: string, updates: Partial<Shipment>): Promise<Shipment> {
    return apiClient.put<Shipment>(`/shipments/${id}`, updates);
  }
}

