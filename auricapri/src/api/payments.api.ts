import { apiClient } from './client';
import type {
  InstallmentOptionsResponse,
  SplitCardOptions,
  PaymentRequest,
  SplitPaymentRequest,
  PaymentResponse,
  SplitPaymentResponse
} from '../types/payment.types';

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
  // ==================== Installment Options ====================

  /**
   * Busca opções de parcelamento para um valor
   */
  async getInstallmentOptions(amount: number): Promise<InstallmentOptionsResponse> {
    return apiClient.get<InstallmentOptionsResponse>(`/payments/installment-options/${amount}`);
  }

  /**
   * Busca opções de split de cartões
   */
  async getSplitOptions(
    totalAmount: number,
    card1Amount: number,
    card1Installments: number,
    card2Installments: number
  ): Promise<SplitCardOptions> {
    return apiClient.post<SplitCardOptions>('/payments/split-options', {
      totalAmount,
      card1Amount,
      card1Installments,
      card2Installments
    });
  }

  // ==================== Payment Processing ====================

  /**
   * Processa um pagamento (cartão, PIX ou boleto)
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    return apiClient.post<PaymentResponse>('/payments/process', request);
  }

  /**
   * Processa pagamento split com 2 cartões
   */
  async processSplitPayment(request: SplitPaymentRequest): Promise<SplitPaymentResponse> {
    return apiClient.post<SplitPaymentResponse>('/payments/process-split', request);
  }

  // ==================== Payment Management ====================

  /**
   * Busca pagamentos de um pedido
   */
  async getByOrderId(orderId: string): Promise<Payment[]> {
    return apiClient.get<Payment[]>(`/payments/order/${orderId}`);
  }

  /**
   * Atualiza um pagamento (admin)
   */
  async update(id: string, updates: Partial<Payment>): Promise<Payment> {
    return apiClient.put<Payment>(`/payments/${id}`, updates);
  }
}

