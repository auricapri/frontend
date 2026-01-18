import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase.js';
import { getMarketplaceOrchestrator } from '../../services/marketplace/index.js';
import logger from '../../config/logger.js';

const router = Router();

/**
 * Mercado Livre webhook topics:
 * - orders_v2: Order created or updated
 * - shipments: Shipment status changed
 * - questions: Buyer asked a question
 * - messages: Buyer sent a message
 * - items: Product status changed (paused, blocked, etc.)
 * - payments: Payment status changed
 */

interface MLWebhookPayload {
  _id: string;
  topic: string;
  resource: string;
  user_id: number;
  application_id: number;
  sent: string;
  attempts: number;
  received: string;
}

/**
 * @swagger
 * /api/marketplace/webhooks/ml:
 *   post:
 *     summary: Webhook endpoint for Mercado Livre notifications
 *     description: Receives real-time notifications from Mercado Livre
 *     tags: [Marketplace Webhooks]
 */
router.post('/ml', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const payload = req.body as MLWebhookPayload;

    // Log imediato e retornar 200 para evitar retry do ML
    logger.info('ML webhook received', {
      topic: payload.topic,
      resource: payload.resource,
      user_id: payload.user_id,
    });

    // Salvar webhook no banco para processamento assíncrono
    
    // Encontrar config_id pelo user_id do ML (se possível)
    // Por enquanto, salvamos sem config_id e processamos depois
    const { error: insertError } = await supabase
      .from('marketplace_webhook_logs')
      .insert({
        topic: payload.topic,
        resource: payload.resource,
        resource_id: extractResourceId(payload.resource),
        user_id: String(payload.user_id),
        application_id: String(payload.application_id),
        attempts: payload.attempts || 1,
        status: 'pending',
        raw_payload: payload,
      });

    if (insertError) {
      logger.error('Failed to save webhook log', { error: insertError });
    }

    // Retornar 200 imediatamente
    res.status(200).json({ received: true });

    // Processar webhook de forma assíncrona (fire and forget)
    processWebhookAsync(payload).catch(err => {
      logger.error('Async webhook processing failed', { error: err, payload });
    });

  } catch (error) {
    // Sempre retornar 200 para evitar retry infinito do ML
    logger.error('Webhook handler error', { error });
    res.status(200).json({ received: true, error: 'Internal processing error' });
  }
});

/**
 * Extract resource ID from ML resource path
 * Examples:
 *   /orders/123456789 -> 123456789
 *   /items/MLB123456 -> MLB123456
 *   /shipments/123456789 -> 123456789
 */
function extractResourceId(resource: string): string | null {
  if (!resource) return null;
  const parts = resource.split('/').filter(Boolean);
  return parts[parts.length - 1] || null;
}

/**
 * Process webhook asynchronously
 */
async function processWebhookAsync(payload: MLWebhookPayload): Promise<void> {
    const resourceId = extractResourceId(payload.resource);

  try {
    // Encontrar a config correspondente ao user_id do ML
    // Isso requer que o user_id do ML esteja armazenado na config (após OAuth)
    const { data: configs } = await supabase
      .from('marketplace_configs')
      .select('id, provider_id')
      .eq('status', 'connected');

    if (!configs || configs.length === 0) {
      logger.warn('No connected marketplace configs found for webhook processing');
      await updateWebhookStatus(payload._id, 'skipped', 'No connected configs');
      return;
    }

    // Por simplicidade, usamos a primeira config conectada do ML
    // Em produção, você deve mapear user_id -> config_id
    const config = configs[0];

    // Processar baseado no tópico
    switch (payload.topic) {
      case 'orders_v2':
        await processOrderWebhook(config.id, resourceId, payload);
        break;

      case 'shipments':
        await processShipmentWebhook(config.id, resourceId, payload);
        break;

      case 'questions':
        await processQuestionWebhook(config.id, resourceId, payload);
        break;

      case 'messages':
        await processMessageWebhook(config.id, resourceId, payload);
        break;

      case 'items':
        await processItemWebhook(config.id, resourceId, payload);
        break;

      case 'payments':
        await processPaymentWebhook(config.id, resourceId, payload);
        break;

      default:
        logger.info('Unknown webhook topic, skipping', { topic: payload.topic });
        await updateWebhookStatus(payload._id, 'skipped', `Unknown topic: ${payload.topic}`);
        return;
    }

    await updateWebhookStatus(payload._id, 'processed');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Webhook processing failed', { error, payload });
    await updateWebhookStatus(payload._id, 'failed', message);
  }
}

async function updateWebhookStatus(
  webhookId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase
      .from('marketplace_webhook_logs')
      .update({
        status,
        processed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
      .eq('raw_payload->_id', webhookId);
  } catch (err) {
    logger.error('Failed to update webhook status', { err, webhookId });
  }
}

// ============================================
// WEBHOOK PROCESSORS
// ============================================

async function processOrderWebhook(configId: string, orderId: string | null, payload: MLWebhookPayload): Promise<void> {
  if (!orderId) return;

  logger.info('Processing order webhook', { configId, orderId });

  try {
    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(configId);

    if (!provider || !('getOrder' in provider)) {
      logger.warn('Provider does not support getOrder', { configId });
      return;
    }

    // Buscar detalhes do pedido na API do ML
    const order = await (provider as any).getOrder(orderId);

    if (!order) {
      logger.warn('Order not found in ML', { orderId });
      return;
    }

    // Salvar/atualizar no banco
    
    await supabase
      .from('marketplace_orders')
      .upsert({
        config_id: configId,
        external_order_id: orderId,
        external_order_status: order.status,
        buyer_id: String(order.buyer?.id),
        buyer_nickname: order.buyer?.nickname,
        buyer_email: order.buyer?.email,
        shipping_id: String(order.shipping?.id),
        shipping_status: order.shipping?.status,
        total_amount: order.total_amount,
        fee_amount: order.fee_amount,
        order_date: order.date_created,
        date_closed: order.date_closed,
        raw_data: order,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'config_id,external_order_id',
      });

    logger.info('Order webhook processed successfully', { orderId });

  } catch (error) {
    logger.error('Failed to process order webhook', { error, orderId });
    throw error;
  }
}

async function processShipmentWebhook(configId: string, shipmentId: string | null, payload: MLWebhookPayload): Promise<void> {
  if (!shipmentId) return;

  logger.info('Processing shipment webhook', { configId, shipmentId });

  try {
    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(configId);

    if (!provider || !('getShipmentDetails' in provider)) {
      return;
    }

    const shipment = await (provider as any).getShipmentDetails(shipmentId);

    if (!shipment) return;

    
    // Atualizar status do envio no pedido
    await supabase
      .from('marketplace_orders')
      .update({
        shipping_status: shipment.status,
        shipping_tracking_number: shipment.tracking_number,
        updated_at: new Date().toISOString(),
      })
      .eq('config_id', configId)
      .eq('shipping_id', shipmentId);

    // Adicionar evento de tracking se houver
    if (shipment.status_history && shipment.status_history.length > 0) {
      const latestEvent = shipment.status_history[shipment.status_history.length - 1];

      await supabase
        .from('marketplace_shipment_events')
        .insert({
          shipment_id: shipmentId,
          event_type: latestEvent.status,
          event_date: latestEvent.date,
          description: latestEvent.message,
          raw_data: latestEvent,
        });
    }

    logger.info('Shipment webhook processed successfully', { shipmentId });

  } catch (error) {
    logger.error('Failed to process shipment webhook', { error, shipmentId });
    throw error;
  }
}

async function processQuestionWebhook(configId: string, questionId: string | null, payload: MLWebhookPayload): Promise<void> {
  if (!questionId) return;

  logger.info('Processing question webhook', { configId, questionId });

  try {
    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(configId);

    if (!provider || !('getQuestion' in provider)) {
      return;
    }

    const question = await (provider as any).getQuestion(questionId);

    if (!question) return;

    
    await supabase
      .from('marketplace_questions')
      .upsert({
        config_id: configId,
        external_question_id: questionId,
        external_product_id: question.item_id,
        buyer_id: String(question.from?.id),
        buyer_nickname: question.from?.nickname,
        question_text: question.text,
        answer_text: question.answer?.text,
        status: question.status === 'ANSWERED' ? 'answered' : 'unanswered',
        asked_at: question.date_created,
        answered_at: question.answer?.date_created,
        raw_data: question,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'config_id,external_question_id',
      });

    logger.info('Question webhook processed successfully', { questionId });

  } catch (error) {
    logger.error('Failed to process question webhook', { error, questionId });
    throw error;
  }
}

async function processMessageWebhook(configId: string, messageId: string | null, payload: MLWebhookPayload): Promise<void> {
  if (!messageId) return;

  logger.info('Processing message webhook', { configId, messageId });

  // TODO: Implementar processamento de mensagens
  // Requer buscar detalhes da mensagem e associar ao pedido
}

async function processItemWebhook(configId: string, itemId: string | null, payload: MLWebhookPayload): Promise<void> {
  if (!itemId) return;

  logger.info('Processing item webhook', { configId, itemId });

  try {
    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(configId);

    if (!provider) return;

    const product = await provider.getProduct(itemId);

    if (!product) return;

    
    // Atualizar status do produto no mapping
    await supabase
      .from('marketplace_product_mappings')
      .update({
        sync_status: product.status === 'active' ? 'synced' : 'error',
        sync_error: product.status !== 'active' ? `Product status: ${product.status}` : null,
        updated_at: new Date().toISOString(),
      })
      .eq('config_id', configId)
      .eq('external_product_id', itemId);

    logger.info('Item webhook processed successfully', { itemId });

  } catch (error) {
    logger.error('Failed to process item webhook', { error, itemId });
    throw error;
  }
}

async function processPaymentWebhook(configId: string, paymentId: string | null, payload: MLWebhookPayload): Promise<void> {
  if (!paymentId) return;

  logger.info('Processing payment webhook', { configId, paymentId });

  // TODO: Implementar processamento de pagamentos
  // Requer buscar detalhes do pagamento e atualizar pedido
}

export default router;
