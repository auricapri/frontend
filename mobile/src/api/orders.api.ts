import { apiClient } from './client';
import { Order, AddressData, InternalLogisticsInfo, CartItem } from '../types';

export class OrdersApi {
  async getAll(): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders');
  }

  async getById(id: string): Promise<Order | null> {
    return apiClient.get<Order | null>(`/orders/${id}`);
  }

  async getByUserId(_userId: string): Promise<Order[]> {
    // Backend uses authenticated route /orders which automatically gets user orders from req.userId
    return apiClient.get<Order[]>('/orders');
  }

  async create(order: {
    items: CartItem[];
    addressData: AddressData;
    logisticsInfo: InternalLogisticsInfo;
    paymentMethod: 'credit_card' | 'pix';
    subtotal: number;
    finalAmount: number;
  }): Promise<Order> {
    return apiClient.post<Order>('/orders', order);
  }

  async updateStatus(id: string, status: string, trackingCode?: string): Promise<Order> {
    return apiClient.put<Order>(`/orders/${id}/status`, { status, trackingCode });
  }

  async downloadReceiptPDF(orderId: string): Promise<string> {
    return apiClient.downloadFile(`/pdf/receipt/${orderId}`, `comprovante-${orderId.slice(0, 8)}.pdf`);
  }

  async downloadPLPPDF(orderId: string): Promise<string> {
    return apiClient.downloadFile(`/pdf/plp/${orderId}`, `PLP-${orderId.slice(0, 8)}.pdf`);
  }

  async getStatusHistory(orderId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/orders/${orderId}/status-history`);
  }

  async getByIdForReview(id: string): Promise<Order | null> {
    return apiClient.get<Order | null>(`/orders/${id}/review`);
  }
}

