/**
 * AsaasService - Serviço de integração com a API do Asaas
 *
 * Este serviço é responsável por toda comunicação com o gateway de pagamento Asaas,
 * incluindo criação de clientes, cobranças via cartão, PIX e boleto.
 *
 * Documentação Asaas: https://docs.asaas.com/reference
 */

import logger from '../config/logger.js';

// ==================== Types ====================

export interface AsaasCustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  externalReference?: string;
}

export interface AsaasCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone: string;
  mobilePhone?: string;
}

export interface AsaasPaymentResponse {
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  value: number;
  netValue: number;
  billingType: string;
  status: AsaasPaymentStatus;
  dueDate: string;
  description?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  invoiceNumber?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  creditCard?: {
    creditCardNumber: string;
    creditCardBrand: string;
    creditCardToken: string;
  };
  pixTransaction?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
}

export type AsaasPaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

export interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    status: AsaasPaymentStatus;
    billingType: string;
    externalReference?: string;
    confirmedDate?: string;
    paymentDate?: string;
  };
}

export interface ChargeCardParams {
  customerId: string;
  amount: number;
  installments: number;
  card?: AsaasCardData;
  cardToken?: string;
  cardHolderInfo: AsaasCardHolderInfo;
  orderId: string;
  description?: string;
  remoteIp: string;
}

export interface CreatePixChargeParams {
  customerId: string;
  amount: number;
  orderId: string;
  description?: string;
  expirationMinutes?: number;
}

export interface CreateBoletoChargeParams {
  customerId: string;
  amount: number;
  orderId: string;
  dueDate: Date;
  description?: string;
}

export interface PixChargeResponse {
  paymentId: string;
  qrCodeImage: string;
  qrCodePayload: string;
  expiresAt: Date;
}

export interface BoletoChargeResponse {
  paymentId: string;
  barCode: string;
  bankSlipUrl: string;
  dueDate: Date;
}

// ==================== Service ====================

export class AsaasService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    const environment = process.env.ASAAS_ENVIRONMENT || 'sandbox';

    this.baseUrl = environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    if (!this.apiKey) {
      logger.warn('ASAAS_API_KEY não configurada. Pagamentos não funcionarão.');
    }
  }

  /**
   * Faz uma requisição para a API do Asaas
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey,
        'User-Agent': 'Auricapri/1.0'
      }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    logger.debug(`Asaas API request: ${method} ${endpoint}`, { body });

    const response = await fetch(url, options);
    const data: any = await response.json();

    if (!response.ok) {
      logger.error('Asaas API error', {
        status: response.status,
        endpoint,
        error: data
      });
      throw new AsaasApiError(
        data.errors?.[0]?.description || 'Erro na API do Asaas',
        response.status,
        data
      );
    }

    logger.debug(`Asaas API response: ${method} ${endpoint}`, { data });
    return data as T;
  }

  // ==================== Customers ====================

  /**
   * Busca cliente pelo CPF/CNPJ
   */
  async findCustomerByCpfCnpj(cpfCnpj: string): Promise<string | null> {
    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');

    try {
      const response = await this.request<{ data: Array<{ id: string }> }>(
        'GET',
        `/customers?cpfCnpj=${cleanCpfCnpj}`
      );

      if (response.data && response.data.length > 0) {
        return response.data[0].id;
      }
      return null;
    } catch (error) {
      logger.error('Erro ao buscar cliente no Asaas', { cpfCnpj, error });
      return null;
    }
  }

  /**
   * Cria um novo cliente no Asaas
   */
  async createCustomer(data: AsaasCustomerData): Promise<string> {
    const response = await this.request<{ id: string }>('POST', '/customers', {
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
      phone: data.phone?.replace(/\D/g, ''),
      mobilePhone: data.mobilePhone?.replace(/\D/g, ''),
      postalCode: data.postalCode?.replace(/\D/g, ''),
      address: data.address,
      addressNumber: data.addressNumber,
      complement: data.complement,
      province: data.province,
      externalReference: data.externalReference,
      notificationDisabled: false
    });

    return response.id;
  }

  /**
   * Busca ou cria cliente no Asaas
   */
  async getOrCreateCustomer(data: AsaasCustomerData): Promise<string> {
    // Primeiro tenta encontrar pelo CPF/CNPJ
    const existingId = await this.findCustomerByCpfCnpj(data.cpfCnpj);
    if (existingId) {
      return existingId;
    }

    // Se não encontrou, cria novo
    return await this.createCustomer(data);
  }

  // ==================== Card Payments ====================

  /**
   * Processa pagamento com cartão de crédito
   */
  async chargeCard(params: ChargeCardParams): Promise<AsaasPaymentResponse> {
    const payload: Record<string, unknown> = {
      customer: params.customerId,
      billingType: 'CREDIT_CARD',
      value: params.amount,
      dueDate: new Date().toISOString().split('T')[0],
      description: params.description || `Pedido ${params.orderId}`,
      externalReference: params.orderId,
      installmentCount: params.installments,
      installmentValue: Math.ceil((params.amount / params.installments) * 100) / 100,
      creditCardHolderInfo: {
        name: params.cardHolderInfo.name,
        email: params.cardHolderInfo.email,
        cpfCnpj: params.cardHolderInfo.cpfCnpj.replace(/\D/g, ''),
        postalCode: params.cardHolderInfo.postalCode.replace(/\D/g, ''),
        addressNumber: params.cardHolderInfo.addressNumber,
        addressComplement: params.cardHolderInfo.addressComplement,
        phone: params.cardHolderInfo.phone.replace(/\D/g, ''),
        mobilePhone: params.cardHolderInfo.mobilePhone?.replace(/\D/g, '')
      },
      remoteIp: params.remoteIp
    };

    // Usar token existente ou dados do cartão
    if (params.cardToken) {
      payload.creditCardToken = params.cardToken;
    } else if (params.card) {
      payload.creditCard = {
        holderName: params.card.holderName,
        number: params.card.number.replace(/\D/g, ''),
        expiryMonth: params.card.expiryMonth,
        expiryYear: params.card.expiryYear.length === 2 ? `20${params.card.expiryYear}` : params.card.expiryYear,
        ccv: params.card.ccv
      };
    } else {
      throw new Error('Card data or token is required');
    }

    return await this.request<AsaasPaymentResponse>('POST', '/payments', payload);
  }

  /**
   * Tokeniza um cartão para uso futuro
   */
  async tokenizeCard(
    customerId: string,
    card: AsaasCardData,
    cardHolderInfo: AsaasCardHolderInfo,
    remoteIp: string
  ): Promise<string> {
    const response = await this.request<{ creditCardToken: string }>(
      'POST',
      '/creditCard/tokenize',
      {
        customer: customerId,
        creditCard: {
          holderName: card.holderName,
          number: card.number.replace(/\D/g, ''),
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear.length === 2 ? `20${card.expiryYear}` : card.expiryYear,
          ccv: card.ccv
        },
        creditCardHolderInfo: {
          name: cardHolderInfo.name,
          email: cardHolderInfo.email,
          cpfCnpj: cardHolderInfo.cpfCnpj.replace(/\D/g, ''),
          postalCode: cardHolderInfo.postalCode.replace(/\D/g, ''),
          addressNumber: cardHolderInfo.addressNumber,
          addressComplement: cardHolderInfo.addressComplement,
          phone: cardHolderInfo.phone.replace(/\D/g, ''),
          mobilePhone: cardHolderInfo.mobilePhone?.replace(/\D/g, '')
        },
        remoteIp
      }
    );

    return response.creditCardToken;
  }

  // ==================== PIX Payments ====================

  /**
   * Cria uma cobrança PIX
   */
  async createPixCharge(params: CreatePixChargeParams): Promise<PixChargeResponse> {
    const expirationMinutes = params.expirationMinutes || 30;
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + expirationMinutes);

    const response = await this.request<AsaasPaymentResponse>('POST', '/payments', {
      customer: params.customerId,
      billingType: 'PIX',
      value: params.amount,
      dueDate: new Date().toISOString().split('T')[0],
      description: params.description || `Pedido ${params.orderId}`,
      externalReference: params.orderId
    });

    // Buscar QR Code da cobrança
    const pixData = await this.request<{
      encodedImage: string;
      payload: string;
      expirationDate: string;
    }>('GET', `/payments/${response.id}/pixQrCode`);

    return {
      paymentId: response.id,
      qrCodeImage: pixData.encodedImage,
      qrCodePayload: pixData.payload,
      expiresAt: new Date(pixData.expirationDate)
    };
  }

  // ==================== Boleto Payments ====================

  /**
   * Cria uma cobrança por boleto
   */
  async createBoletoCharge(params: CreateBoletoChargeParams): Promise<BoletoChargeResponse> {
    const response = await this.request<AsaasPaymentResponse>('POST', '/payments', {
      customer: params.customerId,
      billingType: 'BOLETO',
      value: params.amount,
      dueDate: params.dueDate.toISOString().split('T')[0],
      description: params.description || `Pedido ${params.orderId}`,
      externalReference: params.orderId
    });

    // Buscar linha digitável do boleto
    const identificationField = await this.request<{
      identificationField: string;
      nossoNumero: string;
      barCode: string;
    }>('GET', `/payments/${response.id}/identificationField`);

    return {
      paymentId: response.id,
      barCode: identificationField.barCode || identificationField.identificationField,
      bankSlipUrl: response.bankSlipUrl || '',
      dueDate: new Date(response.dueDate)
    };
  }

  // ==================== Payment Management ====================

  /**
   * Consulta status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<AsaasPaymentResponse> {
    return await this.request<AsaasPaymentResponse>('GET', `/payments/${paymentId}`);
  }

  /**
   * Cancela/estorna um pagamento
   */
  async refundPayment(paymentId: string, value?: number): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (value) {
      payload.value = value;
    }

    await this.request<void>('POST', `/payments/${paymentId}/refund`, payload);
  }

  /**
   * Cancela uma cobrança pendente
   */
  async cancelPayment(paymentId: string): Promise<void> {
    await this.request<void>('DELETE', `/payments/${paymentId}`);
  }

  // ==================== Webhooks ====================

  /**
   * Valida assinatura do webhook usando comparação segura
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!webhookToken) {
      logger.error('ASAAS_WEBHOOK_TOKEN não configurado - rejeitando webhook por segurança');
      return false; // SEGURANÇA: Rejeitar quando token não configurado
    }

    if (!signature) {
      logger.warn('Webhook recebido sem assinatura');
      return false;
    }

    // Asaas usa o token como header "asaas-access-token"
    // Usar comparação de tempo constante para prevenir timing attacks
    const crypto = require('crypto');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(webhookToken, 'utf8')
      );
    } catch {
      // Se os buffers tiverem tamanhos diferentes, timingSafeEqual lança erro
      return false;
    }
  }

  /**
   * Processa evento de webhook
   */
  async handleWebhookEvent(payload: AsaasWebhookPayload): Promise<{
    orderId: string | null;
    status: AsaasPaymentStatus | null;
    action: 'confirm' | 'refund' | 'cancel' | 'none';
  }> {
    const { event, payment } = payload;

    if (!payment) {
      return { orderId: null, status: null, action: 'none' };
    }

    const orderId = payment.externalReference || null;
    const status = payment.status;

    logger.info('Webhook Asaas recebido', { event, paymentId: payment.id, orderId, status });

    let action: 'confirm' | 'refund' | 'cancel' | 'none' = 'none';

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        action = 'confirm';
        break;
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_REFUND_IN_PROGRESS':
        action = 'refund';
        break;
      case 'PAYMENT_DELETED':
      case 'PAYMENT_OVERDUE':
        action = 'cancel';
        break;
    }

    return { orderId, status, action };
  }

  // ==================== Utilities ====================

  /**
   * Verifica se o serviço está configurado
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Retorna o ambiente atual
   */
  getEnvironment(): 'production' | 'sandbox' {
    return this.baseUrl.includes('sandbox') ? 'sandbox' : 'production';
  }
}

// ==================== Error Class ====================

export class AsaasApiError extends Error {
  public statusCode: number;
  public details: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'AsaasApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
