import { Router, Request, Response, NextFunction } from 'express';
import { PaymentsRepository } from '../../repositories/payments.repository.js';
import { PaymentsController } from '../controllers/payments.controller.js';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { paymentRateLimiter, webhookRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();
const paymentsRepo = new PaymentsRepository();
const paymentsController = new PaymentsController();

// ==================== Public Routes ====================

// GET /api/payments/installment-options/:amount - Get installment options for an amount
router.get('/installment-options/:amount', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await paymentsController.getInstallmentOptions(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/split-options - Get split card options
router.post('/split-options', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await paymentsController.getSplitOptions(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/webhook/asaas - Asaas webhook handler (no auth required)
// SEGURANÇA: Rate limiting para webhooks
router.post('/webhook/asaas', webhookRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await paymentsController.handleAsaasWebhook(req, res);
  } catch (error) {
    next(error);
  }
});

// ==================== Authenticated Routes ====================

// POST /api/payments/process - Process a payment
// SEGURANÇA: Rate limiting para pagamentos
router.post('/process', paymentRateLimiter, authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    (req as any).userId = req.userId;
    await paymentsController.processPayment(req as Request, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/process-split - Process split payment with 2 cards
// SEGURANÇA: Rate limiting para pagamentos
router.post('/process-split', paymentRateLimiter, authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    (req as any).userId = req.userId;
    await paymentsController.processSplitPayment(req as Request, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/order/:orderId - Get payments for an order
router.get('/order/:orderId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const payments = await paymentsRepo.getByOrderId(req.params.orderId);
    res.json(payments);
  } catch (error: unknown) {
    next(error);
  }
});

// PUT /api/payments/:id - Update payment (admin only)
// SEGURANÇA: Adicionado requireAdmin middleware
router.put('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const payment = await paymentsRepo.update(req.params.id, updates);
    res.json(payment);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

