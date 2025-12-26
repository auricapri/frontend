import { apiClient } from './client';

export interface Payment {
  id: string;
  order_id: string;
  provider_code: string | null;
  provider_payment_id: string | null;
  status: string;
  attempt_number: number;
  amount: number;
  currency: string;
  metadata: any;
  created_at: string;
}

export class PaymentsApi {
  async getByOrderId(orderId: string): Promise<Payment[]> {
    return apiClient.get<Payment[]>(`/payments/order/${orderId}`);
  }

  async update(id: string, updates: Partial<Payment>): Promise<Payment> {
    return apiClient.put<Payment>(`/payments/${id}`, updates);
  }
}

