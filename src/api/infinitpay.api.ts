import { apiClient } from './client';

export interface CreatePaymentLinkRequest {
  amount: number;
  description: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  items: any[];
  addressData: any;
  logisticsInfo: any;
  subtotal: number;
}

export interface PaymentLinkResponse {
  order_id: string;
  checkout_url: string;
  invoice_slug?: string;
}

export interface PaymentStatusRequest {
  order_nsu: string;
  transaction_nsu: string;
  slug: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  paid: boolean;
  amount: number;
  paid_amount: number;
  installments: number;
  capture_method: 'credit_card' | 'pix';
}

export class InfinitPayApi {
  async createPaymentLink(data: CreatePaymentLinkRequest): Promise<PaymentLinkResponse> {
    return apiClient.post<PaymentLinkResponse>('/infinitpay/create-link', data);
  }

  async checkPaymentStatus(data: PaymentStatusRequest): Promise<PaymentStatusResponse> {
    return apiClient.post<PaymentStatusResponse>('/infinitpay/payment-check', data);
  }
}
