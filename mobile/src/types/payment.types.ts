/**
 * Tipos relacionados a pagamentos e parcelamento
 */

// ==================== Installment Types ====================

export interface InstallmentOption {
  code: string;           // Código da faixa de taxa (ex: 'INST_1', 'INST_2_6', 'INST_7_12')
  installments: number;   // Número de parcelas
  installmentValue: number; // Valor de cada parcela
  totalValue: number;     // Valor total com taxa
  feeAmount: number;      // Valor da taxa aplicada
  label: string;          // Label formatado para exibição
}

export interface InstallmentOptionsResponse {
  baseAmount: number;
  options: InstallmentOption[];
  maxInstallments: number;
}

// ==================== Split Card Types ====================

export interface SplitCardInfo {
  amount: number;
  installments: number;
  code: string;
  totalWithFee: number;
  installmentValue: number;
  feeAmount: number;
}

export interface SplitCardOptions {
  card1: SplitCardInfo;
  card2: SplitCardInfo;
  grandTotal: number;
  totalFees: number;
}

export interface SplitCardPayment {
  amount: number;
  installments: number;
  installmentCode: string;
  card?: CardData;
  cardToken?: string;
  saveCard?: boolean;
}

// ==================== Card Types ====================

export interface CardData {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  token?: string;
  exp_month: string;
  exp_year: string;
}

// ==================== Customer Info ====================

export interface CustomerPaymentInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
}

// ==================== Payment Request Types ====================

export interface PaymentRequest {
  orderId: string;
  method: 'credit_card' | 'pix' | 'boleto';
  installments?: number;
  installmentCode?: string;
  card?: CardData;
  cardToken?: string;
  saveCard?: boolean;
  customerInfo: CustomerPaymentInfo;
  boletoDueDate?: string;
}

export interface SplitPaymentRequest {
  orderId: string;
  cards: [SplitCardPayment, SplitCardPayment];
  customerInfo: CustomerPaymentInfo;
}

// ==================== Payment Response Types ====================

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  installments?: number;
  installmentValue?: number;
  feeAmount?: number;
  // PIX specific
  qrCodeImage?: string;
  qrCodePayload?: string;
  expiresAt?: string;
  // Boleto specific
  barCode?: string;
  bankSlipUrl?: string;
  dueDate?: string;
}

export interface SplitPaymentResponse {
  success: boolean;
  payments: Array<{
    cardIndex: number;
    paymentId: string;
    status: PaymentStatus;
    amount: number;
    installments: number;
  }>;
  totalAmount: number;
}

export type PaymentStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'refund_pending'
  | 'disputed'
  | 'cancelled';

// ==================== Checkout State Types ====================

export interface InstallmentState {
  selectedInstallments: number;
  selectedCode: string;
  options: InstallmentOption[];
  isLoading: boolean;
}

export interface SplitCardState {
  enabled: boolean;
  card1Amount: number;
  card1Installments: number;
  card1Code: string;
  card2Installments: number;
  card2Code: string;
  card1Options: InstallmentOption[];
  card2Options: InstallmentOption[];
}
