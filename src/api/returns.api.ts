import { apiClient } from './client';

export interface Return {
  id: string;
  order_id: string;
  status: string;
  reason: string | null;
  rma_code: string | null;
  refund_amount: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export class ReturnsApi {
  async getAll(): Promise<Return[]> {
    return apiClient.get<Return[]>('/returns');
  }

  async getByOrderId(orderId: string): Promise<Return[]> {
    return apiClient.get<Return[]>(`/returns/order/${orderId}`);
  }

  async create(data: {
    order_id: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Return> {
    return apiClient.post<Return>('/returns', data);
  }

  async update(id: string, updates: Partial<Return>): Promise<Return> {
    return apiClient.put<Return>(`/returns/${id}`, updates);
  }
}

