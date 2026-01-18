/**
 * PaymentsController - Controlador de pagamentos
 *
 * Responsável pelos endpoints de:
 * - Opções de parcelamento
 * - Processamento de pagamentos (cartão, PIX, boleto)
 * - Split de cartões
 * - Webhooks do Asaas
 */

import { Request, Response } from 'express';
import { AsaasService, AsaasWebhookPayload, AsaasCardData, AsaasCardHolderInfo } from '../../services/asaas.service.js';
import { InstallmentFeeService, InstallmentOption } from '../../services/installment-fee.service.js';
import { OrdersRepository } from '../../repositories/orders.repository.js';
import { PaymentsRepository } from '../../repositories/payments.repository.js';
import { UsersRepository } from '../../repositories/users.repository.js';
import { OrderStatus, PaymentMethod, PaymentProvider } from '../../../shared/types/enums.js';
import logger from '../../config/logger.js';

// ==================== Types ====================

interface ProcessPaymentBody {
  orderId: string;
  method: 'credit_card' | 'pix' | 'boleto';
  installments?: number;
  installmentCode?: string;
  card?: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  cardToken?: string;
  saveCard?: boolean;
  customerInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
  };
  boletoDueDate?: string;
}

interface ProcessSplitPaymentBody {
  orderId: string;
  cards: Array<{
    amount: number;
    installments: number;
    installmentCode: string;
    card?: {
      number: string;
      holderName: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
    };
    cardToken?: string;
    saveCard?: boolean;
  }>;
  customerInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
  };
}

// ==================== Controller ====================

export class PaymentsController {
  private asaasService: AsaasService;
  private installmentService: InstallmentFeeService;
  private ordersRepo: OrdersRepository;
  private paymentsRepo: PaymentsRepository;
  private usersRepo: UsersRepository;

  constructor() {
    this.asaasService = new AsaasService();
    this.installmentService = new InstallmentFeeService();
    this.ordersRepo = new OrdersRepository();
    this.paymentsRepo = new PaymentsRepository();
    this.usersRepo = new UsersRepository();
  }

  // ==================== Installment Options ====================

  /**
   * GET /api/payments/installment-options/:amount
   * Retorna opções de parcelamento para um valor
   */
  async getInstallmentOptions(req: Request, res: Response): Promise<void> {
    try {
      const amount = parseFloat(req.params.amount);

      if (isNaN(amount) || amount <= 0) {
        res.status(400).json({ error: 'Valor inválido' });
        return;
      }

      const options = this.installmentService.getInstallmentOptions(amount);

      res.json({
        baseAmount: amount,
        options,
        maxInstallments: this.installmentService.getMaxInstallmentsForAmount(amount)
      });
    } catch (error) {
      logger.error('Erro ao calcular opções de parcelamento', { error });
      res.status(500).json({ error: 'Erro ao calcular opções de parcelamento' });
    }
  }

  /**
   * POST /api/payments/split-options
   * Retorna opções de parcelamento para split de cartões
   */
  async getSplitOptions(req: Request, res: Response): Promise<void> {
    try {
      const { totalAmount, card1Amount, card1Installments, card2Installments } = req.body;

      if (!totalAmount || !card1Amount || !card1Installments || !card2Installments) {
        res.status(400).json({ error: 'Parâmetros obrigatórios: totalAmount, card1Amount, card1Installments, card2Installments' });
        return;
      }

      const splitOptions = this.installmentService.calculateSplitCardOptions(
        totalAmount,
        card1Amount,
        card1Installments,
        card2Installments
      );

      res.json(splitOptions);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao calcular split';
      res.status(400).json({ error: message });
    }
  }

  // ==================== Payment Processing ====================

  /**
   * POST /api/payments/process
   * Processa um pagamento (cartão, PIX ou boleto)
   */
  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as ProcessPaymentBody;
      const userId = (req as any).userId;

      // Validações básicas
      if (!body.orderId || !body.method || !body.customerInfo) {
        res.status(400).json({ error: 'Campos obrigatórios: orderId, method, customerInfo' });
        return;
      }

      // Buscar pedido
      const order = await this.ordersRepo.getById(body.orderId);
      if (!order) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      // Verificar se já foi pago
      const existingPayments = await this.paymentsRepo.getByOrderId(body.orderId);
      const successfulPayment = existingPayments.find(p => p.status === 'succeeded' || p.status === 'CONFIRMED');
      if (successfulPayment) {
        res.status(400).json({ error: 'Pedido já foi pago' });
        return;
      }

      // Criar/buscar cliente no Asaas
      const customerId = await this.asaasService.getOrCreateCustomer({
        name: body.customerInfo.name,
        email: body.customerInfo.email,
        cpfCnpj: body.customerInfo.cpfCnpj,
        phone: body.customerInfo.phone,
        postalCode: body.customerInfo.postalCode,
        address: order.shipping_address_snapshot?.logradouro,
        addressNumber: body.customerInfo.addressNumber,
        complement: body.customerInfo.addressComplement,
        province: order.shipping_address_snapshot?.bairro,
        externalReference: userId
      });

      const remoteIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
      let result: any;

      switch (body.method) {
        case 'credit_card':
          result = await this.processCreditCard(body, customerId, order.total, remoteIp, userId);
          break;

        case 'pix':
          result = await this.processPix(body, customerId, order.total);
          break;

        case 'boleto':
          result = await this.processBoleto(body, customerId, order.total);
          break;

        default:
          res.status(400).json({ error: 'Método de pagamento inválido' });
          return;
      }

      // Criar registro de pagamento
      await this.paymentsRepo.create({
        order_id: body.orderId,
        provider_code: PaymentProvider.ASAAS,
        provider_payment_id: result.paymentId,
        status: result.status,
        amount: result.amount,
        currency: 'BRL',
        metadata: {
          method: body.method,
          installments: body.installments,
          asaasResponse: result.raw
        }
      });

      res.json({
        success: true,
        paymentId: result.paymentId,
        status: result.status,
        ...result.data
      });

    } catch (error) {
      logger.error('Erro ao processar pagamento', { error });
      const message = error instanceof Error ? error.message : 'Erro ao processar pagamento';
      res.status(500).json({ error: message });
    }
  }

  /**
   * Processa pagamento com cartão de crédito
   */
  private async processCreditCard(
    body: ProcessPaymentBody,
    customerId: string,
    orderAmount: number,
    remoteIp: string,
    userId?: string
  ) {
    const installments = body.installments || 1;
    const installmentCode = body.installmentCode || 'INST_1';

    // Validar e calcular valor com taxa
    const validation = this.installmentService.validateAndCalculate(
      orderAmount,
      installments,
      installmentCode
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const finalAmount = validation.calculatedTotal;

    // Preparar dados do cartão
    let cardData: AsaasCardData | undefined;
    let cardToken: string | undefined;

    if (body.cardToken) {
      cardToken = body.cardToken;
    } else if (body.card) {
      cardData = {
        holderName: body.card.holderName,
        number: body.card.number,
        expiryMonth: body.card.expiryMonth,
        expiryYear: body.card.expiryYear,
        ccv: body.card.cvv
      };
    } else {
      throw new Error('Dados do cartão ou token são obrigatórios');
    }

    const cardHolderInfo: AsaasCardHolderInfo = {
      name: body.customerInfo.name,
      email: body.customerInfo.email,
      cpfCnpj: body.customerInfo.cpfCnpj,
      postalCode: body.customerInfo.postalCode,
      addressNumber: body.customerInfo.addressNumber,
      addressComplement: body.customerInfo.addressComplement,
      phone: body.customerInfo.phone
    };

    // Processar pagamento
    const response = await this.asaasService.chargeCard({
      customerId,
      amount: finalAmount,
      installments,
      card: cardData,
      cardToken,
      cardHolderInfo,
      orderId: body.orderId,
      remoteIp
    });

    // Salvar token do cartão se solicitado
    if (body.saveCard && userId && response.creditCard?.creditCardToken) {
      try {
        await this.saveCardToken(userId, response.creditCard);
      } catch (e) {
        logger.warn('Falha ao salvar token do cartão', { error: e });
      }
    }

    return {
      paymentId: response.id,
      status: this.mapAsaasStatus(response.status),
      amount: finalAmount,
      data: {
        installments,
        installmentValue: Math.ceil((finalAmount / installments) * 100) / 100,
        feeAmount: finalAmount - orderAmount
      },
      raw: response
    };
  }

  /**
   * Processa pagamento PIX
   */
  private async processPix(
    body: ProcessPaymentBody,
    customerId: string,
    orderAmount: number
  ) {
    // PIX não tem taxa para o cliente (absorvida pela loja)
    const response = await this.asaasService.createPixCharge({
      customerId,
      amount: orderAmount,
      orderId: body.orderId,
      expirationMinutes: 30
    });

    return {
      paymentId: response.paymentId,
      status: 'pending',
      amount: orderAmount,
      data: {
        qrCodeImage: response.qrCodeImage,
        qrCodePayload: response.qrCodePayload,
        expiresAt: response.expiresAt
      },
      raw: response
    };
  }

  /**
   * Processa pagamento Boleto
   */
  private async processBoleto(
    body: ProcessPaymentBody,
    customerId: string,
    orderAmount: number
  ) {
    // Boleto não tem taxa para o cliente (absorvida pela loja)
    const dueDate = body.boletoDueDate
      ? new Date(body.boletoDueDate)
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 dias

    const response = await this.asaasService.createBoletoCharge({
      customerId,
      amount: orderAmount,
      orderId: body.orderId,
      dueDate
    });

    return {
      paymentId: response.paymentId,
      status: 'pending',
      amount: orderAmount,
      data: {
        barCode: response.barCode,
        bankSlipUrl: response.bankSlipUrl,
        dueDate: response.dueDate
      },
      raw: response
    };
  }

  // ==================== Split Payment ====================

  /**
   * POST /api/payments/process-split
   * Processa pagamento split com 2 cartões
   */
  async processSplitPayment(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as ProcessSplitPaymentBody;
      const userId = (req as any).userId;

      // Validações
      if (!body.orderId || !body.cards || body.cards.length !== 2 || !body.customerInfo) {
        res.status(400).json({ error: 'Campos obrigatórios: orderId, cards (array com 2 itens), customerInfo' });
        return;
      }

      // Buscar pedido
      const order = await this.ordersRepo.getById(body.orderId);
      if (!order) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      // Validar soma dos valores
      const totalCards = body.cards.reduce((sum, c) => sum + c.amount, 0);
      if (Math.abs(totalCards - order.total) > 0.01) {
        res.status(400).json({ error: 'Soma dos valores dos cartões deve ser igual ao total do pedido' });
        return;
      }

      // Criar cliente no Asaas
      const customerId = await this.asaasService.getOrCreateCustomer({
        name: body.customerInfo.name,
        email: body.customerInfo.email,
        cpfCnpj: body.customerInfo.cpfCnpj,
        phone: body.customerInfo.phone,
        postalCode: body.customerInfo.postalCode,
        externalReference: userId
      });

      const remoteIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const cardHolderInfo: AsaasCardHolderInfo = {
        name: body.customerInfo.name,
        email: body.customerInfo.email,
        cpfCnpj: body.customerInfo.cpfCnpj,
        postalCode: body.customerInfo.postalCode,
        addressNumber: body.customerInfo.addressNumber,
        addressComplement: body.customerInfo.addressComplement,
        phone: body.customerInfo.phone
      };

      const paymentResults: any[] = [];

      // Processar cada cartão
      for (let i = 0; i < body.cards.length; i++) {
        const cardPayment = body.cards[i];

        // Validar e calcular taxa
        const validation = this.installmentService.validateAndCalculate(
          cardPayment.amount,
          cardPayment.installments,
          cardPayment.installmentCode
        );

        if (!validation.valid) {
          // Se falhou, estornar pagamentos anteriores
          for (const prev of paymentResults) {
            try {
              await this.asaasService.refundPayment(prev.paymentId);
            } catch (e) {
              logger.error('Falha ao estornar pagamento após erro', { paymentId: prev.paymentId, error: e });
            }
          }
          res.status(400).json({ error: `Cartão ${i + 1}: ${validation.error}` });
          return;
        }

        try {
          let cardData: AsaasCardData | undefined;
          let cardToken: string | undefined;

          if (cardPayment.cardToken) {
            cardToken = cardPayment.cardToken;
          } else if (cardPayment.card) {
            cardData = {
              holderName: cardPayment.card.holderName,
              number: cardPayment.card.number,
              expiryMonth: cardPayment.card.expiryMonth,
              expiryYear: cardPayment.card.expiryYear,
              ccv: cardPayment.card.cvv
            };
          } else {
            throw new Error(`Cartão ${i + 1}: dados ou token são obrigatórios`);
          }

          const response = await this.asaasService.chargeCard({
            customerId,
            amount: validation.calculatedTotal,
            installments: cardPayment.installments,
            card: cardData,
            cardToken,
            cardHolderInfo,
            orderId: `${body.orderId}_card${i + 1}`,
            remoteIp
          });

          paymentResults.push({
            cardIndex: i + 1,
            paymentId: response.id,
            status: this.mapAsaasStatus(response.status),
            amount: validation.calculatedTotal,
            installments: cardPayment.installments
          });

          // Salvar token se solicitado
          if (cardPayment.saveCard && userId && response.creditCard?.creditCardToken) {
            try {
              await this.saveCardToken(userId, response.creditCard);
            } catch (e) {
              logger.warn('Falha ao salvar token do cartão', { error: e });
            }
          }

        } catch (error) {
          // Se falhou, estornar pagamentos anteriores
          for (const prev of paymentResults) {
            try {
              await this.asaasService.refundPayment(prev.paymentId);
            } catch (e) {
              logger.error('Falha ao estornar pagamento após erro', { paymentId: prev.paymentId, error: e });
            }
          }

          const message = error instanceof Error ? error.message : 'Erro ao processar cartão';
          res.status(500).json({ error: `Cartão ${i + 1}: ${message}` });
          return;
        }
      }

      // Criar registros de pagamento
      for (const result of paymentResults) {
        await this.paymentsRepo.create({
          order_id: body.orderId,
          provider_code: PaymentProvider.ASAAS,
          provider_payment_id: result.paymentId,
          status: result.status,
          amount: result.amount,
          currency: 'BRL',
          metadata: {
            method: 'credit_card',
            splitCard: result.cardIndex,
            installments: result.installments
          }
        });
      }

      res.json({
        success: true,
        payments: paymentResults,
        totalAmount: paymentResults.reduce((sum, p) => sum + p.amount, 0)
      });

    } catch (error) {
      logger.error('Erro ao processar pagamento split', { error });
      const message = error instanceof Error ? error.message : 'Erro ao processar pagamento';
      res.status(500).json({ error: message });
    }
  }

  // ==================== Webhook ====================

  /**
   * POST /api/payments/webhook/asaas
   * Recebe webhooks do Asaas
   */
  async handleAsaasWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['asaas-access-token'] as string || '';
      const payload = req.body as AsaasWebhookPayload;

      // Validar assinatura
      if (!this.asaasService.validateWebhookSignature(JSON.stringify(payload), signature)) {
        logger.warn('Webhook com assinatura inválida');
        res.status(401).json({ error: 'Assinatura inválida' });
        return;
      }

      // Processar evento
      const { orderId, status, action } = await this.asaasService.handleWebhookEvent(payload);

      if (!orderId || action === 'none') {
        res.json({ received: true, action: 'ignored' });
        return;
      }

      // Extrair orderId real (pode ser orderId_card1 ou orderId_card2)
      const realOrderId = orderId.replace(/_card\d$/, '');

      // Atualizar pagamento
      if (payload.payment) {
        const payments = await this.paymentsRepo.getByOrderId(realOrderId);
        const payment = payments.find(p => p.provider_payment_id === payload.payment?.id);

        if (payment) {
          await this.paymentsRepo.update(payment.id, {
            status: this.mapAsaasStatus(status!)
          });
        }
      }

      // Atualizar pedido baseado na ação
      if (action === 'confirm') {
        // Verificar se todos os pagamentos do pedido foram confirmados (para split)
        const allPayments = await this.paymentsRepo.getByOrderId(realOrderId);
        const allConfirmed = allPayments.every(p =>
          p.status === 'succeeded' || p.status === 'CONFIRMED' || p.status === 'RECEIVED'
        );

        if (allConfirmed) {
          await this.ordersRepo.updateStatus(realOrderId, OrderStatus.CONFIRMED);
        }
      } else if (action === 'cancel') {
        await this.ordersRepo.updateStatus(realOrderId, OrderStatus.CANCELLED);
      }

      res.json({ received: true, action, orderId: realOrderId });

    } catch (error) {
      logger.error('Erro ao processar webhook Asaas', { error });
      res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  }

  // ==================== Helpers ====================

  /**
   * Mapeia status do Asaas para status interno
   */
  private mapAsaasStatus(asaasStatus: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'pending',
      'RECEIVED': 'succeeded',
      'CONFIRMED': 'succeeded',
      'OVERDUE': 'failed',
      'REFUNDED': 'refunded',
      'RECEIVED_IN_CASH': 'succeeded',
      'REFUND_REQUESTED': 'refund_pending',
      'REFUND_IN_PROGRESS': 'refund_pending',
      'CHARGEBACK_REQUESTED': 'disputed',
      'CHARGEBACK_DISPUTE': 'disputed',
      'AWAITING_CHARGEBACK_REVERSAL': 'disputed',
      'DUNNING_REQUESTED': 'pending',
      'DUNNING_RECEIVED': 'succeeded',
      'AWAITING_RISK_ANALYSIS': 'pending'
    };

    return statusMap[asaasStatus] || 'pending';
  }

  /**
   * Salva token do cartão no perfil do usuário
   */
  private async saveCardToken(
    userId: string,
    cardInfo: { creditCardNumber: string; creditCardBrand: string; creditCardToken: string }
  ): Promise<void> {
    const user = await this.usersRepo.getProfile(userId);
    if (!user) return;

    const savedCards = user.saved_cards || [];
    const last4 = cardInfo.creditCardNumber.slice(-4);

    // Verificar se já existe
    const exists = savedCards.some(c => c.last4 === last4 && c.brand === cardInfo.creditCardBrand);
    if (exists) return;

    savedCards.push({
      id: `asaas_${Date.now()}`,
      brand: cardInfo.creditCardBrand,
      last4,
      gateway_token: cardInfo.creditCardToken
    });

    await this.usersRepo.updateProfile(userId, { saved_cards: savedCards });
  }
}
