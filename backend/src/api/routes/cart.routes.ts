import { Router } from 'express';
import { CartService } from '../../services/cart.service.js';
import { optionalAuth, requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { z } from 'zod';
import logger from '../../config/logger.js';
import { cartRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();
const cartService = new CartService();

router.use(cartRateLimiter);

const CartItemSchema = z.object({
  variant_id: z.string().uuid(),
  product_id: z.string().uuid(),
  name: z.union([z.string(), z.object({
    pt: z.string().optional(),
    en: z.string().optional(),
    es: z.string().optional(),
    fr: z.string().optional(),
  })]),
  image: z.string(),
  size: z.string(),
  color_name: z.union([z.string(), z.object({
    pt: z.string().optional(),
    en: z.string().optional(),
    es: z.string().optional(),
    fr: z.string().optional(),
  })]),
  color_hex: z.string(),
  price: z.number().positive(),
  original_price: z.number().positive().optional(),
  quantity: z.number().int().positive(),
  sku: z.string(),
  applied_coupon_code: z.string().optional(),
});

const AddItemBodySchema = z.object({
  item: CartItemSchema,
});

const UpdateItemParamsSchema = z.object({
  variantId: z.string().uuid(),
});

const UpdateItemBodySchema = z.object({
  quantity: z.number().int().min(0),
});

const RemoveItemParamsSchema = z.object({
  variantId: z.string().uuid(),
});

const MergeCartBodySchema = z.object({
  // SEGURANÇA: Validar sessionId como UUID para prevenir manipulação
  sessionId: z.string().uuid().optional(),
});

// Regex para validação de UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSessionKey(req: AuthenticatedRequest): string {
  if (req.userId) {
    return `user:${req.userId}`;
  }

  const sessionId = req.headers['x-session-id'] as string;
  if (!sessionId) {
    throw new Error('Session ID required for unauthenticated users');
  }

  // SEGURANÇA: Validar session ID como UUID para prevenir manipulação
  if (!UUID_REGEX.test(sessionId)) {
    throw new Error('Invalid session ID format - must be a valid UUID');
  }

  return `session:${sessionId}`;
}

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Obter carrinho do usuário ou sessão
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Session-Id
 *         schema:
 *           type: string
 *         description: ID da sessão (obrigatório para usuários não autenticados)
 *     responses:
 *       200:
 *         description: Carrinho encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Session ID necessário para usuários não autenticados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const sessionKey = getSessionKey(req);
    const cart = await cartService.getCart(sessionKey);
    res.json(cart);
  } catch (error: unknown) {
    logger.error('Error getting cart', { error });
    next(error);
  }
});

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Adicionar item ao carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Session-Id
 *         schema:
 *           type: string
 *         description: ID da sessão (obrigatório para usuários não autenticados)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item
 *             properties:
 *               item:
 *                 type: object
 *                 required:
 *                   - variant_id
 *                   - product_id
 *                   - name
 *                   - image
 *                   - size
 *                   - color_name
 *                   - color_hex
 *                   - price
 *                   - quantity
 *                   - sku
 *                 properties:
 *                   variant_id:
 *                     type: string
 *                     format: uuid
 *                   product_id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     oneOf:
 *                       - type: string
 *                       - type: object
 *                   image:
 *                     type: string
 *                   size:
 *                     type: string
 *                   color_name:
 *                     oneOf:
 *                       - type: string
 *                       - type: object
 *                   color_hex:
 *                     type: string
 *                   price:
 *                     type: number
 *                     minimum: 0
 *                   original_price:
 *                     type: number
 *                     minimum: 0
 *                   quantity:
 *                     type: integer
 *                     minimum: 1
 *                   sku:
 *                     type: string
 *                   applied_coupon_code:
 *                     type: string
 *     responses:
 *       200:
 *         description: Item adicionado ao carrinho
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Dados inválidos ou Session ID necessário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
router.post('/items', optionalAuth, validate({ body: AddItemBodySchema }), async (req: AuthenticatedRequest, res, next) => {
  try {
    const sessionKey = getSessionKey(req);
    const { item } = req.body;
    const cart = await cartService.addItem(sessionKey, item, req.userId);
    res.json(cart);
  } catch (error: unknown) {
    logger.error('Error adding item to cart', { error });
    next(error);
  }
});

/**
 * @swagger
 * /api/cart/items/{variantId}:
 *   put:
 *     summary: Atualizar quantidade de item no carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da variante do produto
 *       - in: header
 *         name: X-Session-Id
 *         schema:
 *           type: string
 *         description: ID da sessão (obrigatório para usuários não autenticados)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Nova quantidade (0 remove o item)
 *     responses:
 *       200:
 *         description: Quantidade atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Item não encontrado no carrinho
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/items/:variantId', optionalAuth, validate({ params: UpdateItemParamsSchema, body: UpdateItemBodySchema }), async (req: AuthenticatedRequest, res, next) => {
  try {
    const sessionKey = getSessionKey(req);
    const { variantId } = req.params;
    const { quantity } = req.body;
    const cart = await cartService.updateItem(sessionKey, variantId, quantity, req.userId);
    res.json(cart);
  } catch (error: unknown) {
    logger.error('Error updating cart item', { error });
    next(error);
  }
});

/**
 * @swagger
 * /api/cart/items/{variantId}:
 *   delete:
 *     summary: Remover item do carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da variante do produto
 *       - in: header
 *         name: X-Session-Id
 *         schema:
 *           type: string
 *         description: ID da sessão (obrigatório para usuários não autenticados)
 *     responses:
 *       200:
 *         description: Item removido do carrinho
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Session ID necessário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Item não encontrado no carrinho
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/items/:variantId', optionalAuth, validate({ params: RemoveItemParamsSchema }), async (req: AuthenticatedRequest, res, next) => {
  try {
    const sessionKey = getSessionKey(req);
    const { variantId } = req.params;
    const cart = await cartService.removeItem(sessionKey, variantId, req.userId);
    res.json(cart);
  } catch (error: unknown) {
    logger.error('Error removing item from cart', { error });
    next(error);
  }
});

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Limpar carrinho completamente
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Session-Id
 *         schema:
 *           type: string
 *         description: ID da sessão (obrigatório para usuários não autenticados)
 *     responses:
 *       204:
 *         description: Carrinho limpo com sucesso
 *       400:
 *         description: Session ID necessário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const sessionKey = getSessionKey(req);
    await cartService.clearCart(sessionKey, req.userId);
    res.status(204).send();
  } catch (error: unknown) {
    logger.error('Error clearing cart', { error });
    next(error);
  }
});

/**
 * @swagger
 * /api/cart/merge:
 *   post:
 *     summary: Mesclar carrinho anônimo com carrinho do usuário autenticado
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: ID da sessão anônima (ou usar header X-Session-Id)
 *     parameters:
 *       - in: header
 *         name: X-Session-Id
 *         schema:
 *           type: string
 *         description: ID da sessão anônima (alternativa ao body)
 *     responses:
 *       200:
 *         description: Carrinhos mesclados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Session ID necessário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Autenticação necessária
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/cart/merge - Merge anonymous cart with user cart (requires authentication)
router.post('/merge', requireAuth, validate({ body: MergeCartBodySchema }), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }

    // Obter sessionId do body ou do header
    const sessionId = req.body.sessionId || (req.headers['x-session-id'] as string);
    
    if (!sessionId) {
      return res.status(400).json({ error: { message: 'Session ID is required' } });
    }

    const anonymousSessionKey = `session:${sessionId}`;
    const mergedCart = await cartService.mergeCarts(anonymousSessionKey, req.userId);
    
    logger.info('Cart merged successfully', { userId: req.userId, sessionId });
    res.json(mergedCart);
  } catch (error: unknown) {
    logger.error('Error merging cart', { error, userId: req.userId });
    next(error);
  }
});

export default router;
