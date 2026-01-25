import { apiClient } from './client';
import { Order, AddressDataInput, LogisticsInfoInput, CartItem, OrderStatusHistoryEntry } from '../types';
import { PaymentMethod, OrderStatus } from '../constants/enums';

export class OrdersApi {
  async getAll(): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders');
  }

  async getAllAdmin(): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders/admin/all');
  }

  async getById(id: string): Promise<Order | null> {
    return apiClient.get<Order | null>(`/orders/${id}`);
  }

  async getByIdForReview(id: string): Promise<Order | null> {
    return apiClient.get<Order | null>(`/orders/${id}/review`);
  }

  async getByUserId(_userId: string): Promise<Order[]> {
    // Backend filters by authenticated user, so we just call getAll
    return apiClient.get<Order[]>('/orders');
  }

  async create(order: {
    items: CartItem[];
    addressData: AddressDataInput;
    logisticsInfo: LogisticsInfoInput;
    paymentMethod: PaymentMethod;
    subtotal: number;
    finalAmount: number;
  }): Promise<Order> {
    const { addressData, logisticsInfo } = order;

    const normalizedAddress = {
      cep: String(addressData.cep || ''),
      street: String(addressData.street || addressData.logradouro || ''),
      number: String(addressData.number || addressData.numero || ''),
      complement: addressData.complement || addressData.complemento || undefined,
      neighborhood: String(addressData.neighborhood || addressData.bairro || ''),
      city: String(addressData.city || addressData.localidade || ''),
      state: String(addressData.state || addressData.uf || ''),
      country: String(addressData.country || 'BR'),
    };

    const normalizedLogistics = {
      provider: logisticsInfo.provider || logisticsInfo.selected_carrier || logisticsInfo.carrier || undefined,
      service: logisticsInfo.service || logisticsInfo.method || undefined,
      cost: logisticsInfo.cost ?? logisticsInfo.real_cost ?? undefined,
      estimated_days: logisticsInfo.estimated_days ?? undefined,
    };

    return apiClient.post<Order>('/orders', {
      ...order,
      addressData: {
        ...addressData,
        ...normalizedAddress,
      },
      logisticsInfo: {
        ...logisticsInfo,
        ...normalizedLogistics,
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus, trackingCode?: string): Promise<Order> {
    return apiClient.put<Order>(`/orders/${id}/status`, { status, trackingCode });
  }

  async downloadReceiptPDF(orderId: string): Promise<void> {
    await apiClient.downloadFile(`/pdf/receipt/${orderId}`, `comprovante-${orderId.slice(0, 8)}.pdf`);
  }

  async downloadPLPPDF(orderId: string): Promise<void> {
    await apiClient.downloadFile(`/pdf/plp/${orderId}`, `PLP-${orderId.slice(0, 8)}.pdf`);
  }

  async getStatusHistory(orderId: string): Promise<OrderStatusHistoryEntry[]> {
    return apiClient.get<OrderStatusHistoryEntry[]>(`/orders/${orderId}/status-history`);
  }
}
