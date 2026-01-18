import { Router } from 'express';
import { OrderService } from '../../services/order.service.js';
import { CartService } from '../../services/cart.service.js';
import { authenticate, optionalAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { OrderStatus } from '../../../shared/types/enums.js';
import { validate } from '../middleware/validation.middleware.js';
import { CreateOrderSchema, UpdateOrderStatusSchema, OrderParamsSchema } from '../../validators/orders.validator.js';
import logger from '../../config/logger.js';

const router = Router();
const orderService = new OrderService();
const cartService = new CartService();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Lista pedidos do usuário autenticado (Admin vê todos os pedidos)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/orders - Get user orders (authenticated) - Admin sees all orders
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { UsersRepository } = await import('../../repositories/users.repository.js');
    const usersRepo = new UsersRepository();
    
    let user;
    try {
      user = await usersRepo.getProfile(req.userId);
    } catch (profileError: unknown) {
      const errorMessage = profileError instanceof Error ? profileError.message : 'Failed to fetch user profile';
      logger.error('Error fetching user profile', { error: errorMessage, userId: req.userId });
      return res.status(500).json({ error: { message: 'Failed to fetch user profile' } });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    
    if (user?.role === 'admin') {
      const { OrdersRepository } = await import('../../repositories/orders.repository.js');
      const ordersRepo = new OrdersRepository();
      const orders = await ordersRepo.getAll({ limit, offset });
      res.json(orders);
    } else {
      const orders = await orderService.getUserOrders(req.userId, { limit, offset });
      res.json(orders);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in GET /api/orders', { error: errorMessage, userId: req.userId });
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Lista todos os pedidos - Apenas Admin
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer permissão de admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/admin/orders/all - Get all orders (admin only) with pagination
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    
    const { OrdersRepository } = await import('../../repositories/orders.repository.js');
    const ordersRepo = new OrdersRepository();
    const orders = await ordersRepo.getAll({ limit, offset });
    res.json(orders);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}/review:
 *   get:
 *     summary: Obter pedido para avaliação (público, apenas pedidos entregues)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Dados do pedido para avaliação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                 user_id:
 *                   type: string
 *                 items:
 *                   type: array
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Pedido ainda não foi entregue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/orders/:id/review - Get order by ID for review (public, no auth required)
router.get('/:id/review', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }
    // Only return basic order info needed for review
    const isDelivered = order.status === OrderStatus.DELIVERED;
    if (!isDelivered) {
      return res.status(400).json({ error: { message: 'Order is not delivered yet' } });
    }
    // Return minimal order data for review
    res.json({
      id: order.id,
      status: order.status,
      user_id: order.user_id,
      items: order.items,
      created_at: order.created_at
    });
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obter pedido por ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - usuário não é dono do pedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/orders/:id - Get order by ID
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }
    // Check if user owns this order, bought it as a gift, or is admin
    const ownsOrder = order.user_id === req.userId;
    const boughtAsGift = order.gift_from_user_id === req.userId;
    // SEGURANÇA: Se order.user_id for null/undefined, apenas admin pode ver
    // Isso previne bypass de autorização quando user_id não está definido
    if (!ownsOrder && !boughtAsGift) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }
    res.json(order);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Criar novo pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - addressData
 *               - logisticsInfo
 *               - paymentMethod
 *               - subtotal
 *               - finalAmount
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               addressData:
 *                 type: object
 *               logisticsInfo:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, pix]
 *               subtotal:
 *                 type: number
 *               finalAmount:
 *                 type: number
 *               giftForUserId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do usuário que receberá o presente (opcional)
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/orders - Create new order (optional auth for guest checkout)
router.post('/', authenticate, validate({ body: CreateOrderSchema }), async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      items,
      addressData,
      logisticsInfo,
      paymentMethod,
      subtotal,
      finalAmount,
      giftForUserId,
      couponId
    } = req.body;

    // Extrair IP do cliente
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || req.ip
      || null;

    const order = await orderService.createOrder(
      items,
      addressData,
      logisticsInfo,
      paymentMethod,
      subtotal,
      finalAmount,
      req.userId,
      giftForUserId,
      undefined, // wishlistSlug
      clientIp || undefined,
      couponId
    );

    // Clear user's cart after successful order creation
    if (req.userId) {
      try {
        const sessionKey = `user:${req.userId}`;
        await cartService.clearCart(sessionKey, req.userId);
        logger.info('Cart cleared after order creation', { userId: req.userId, orderId: order.id });
      } catch (cartError) {
        // Don't fail the order if cart clear fails
        logger.error('Failed to clear cart after order', {
          userId: req.userId,
          orderId: order.id,
          error: cartError instanceof Error ? cartError.message : String(cartError)
        });
      }
    }

    res.status(201).json(order);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Atualizar status do pedido - Apenas Admin
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *               trackingCode:
 *                 type: string
 *                 description: Código de rastreamento (opcional)
 *     responses:
 *       200:
 *         description: Status do pedido atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer permissão de admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', authenticate, requireAdmin, validate({ 
  params: OrderParamsSchema,
  body: UpdateOrderStatusSchema 
}), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, trackingCode } = req.body;
    const order = await orderService.updateOrderStatus(
      req.params.id,
      status,
      trackingCode,
      req.userId
    );
    res.json(order);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}/status-history:
 *   get:
 *     summary: Obter histórico de status do pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Histórico de status do pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   order_id:
 *                     type: string
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/orders/:id/status-history - Get order status history
router.get('/:id/status-history', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { OrderStatusHistoryRepository } = await import('../../repositories/order_status_history.repository.js');
    const historyRepo = new OrderStatusHistoryRepository();
    const history = await historyRepo.getByOrderId(req.params.id);
    res.json(history);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

