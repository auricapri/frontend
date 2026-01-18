import { Router, Request, Response, NextFunction } from 'express';
import { WishlistRepository } from '../../repositories/wishlist.repository.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { OrderService } from '../../services/order.service.js';
import { ProductsRepository } from '../../repositories/products.repository.js';
import logger from '../../config/logger.js';

const router = Router();
const wishlistRepo = new WishlistRepository();
const orderService = new OrderService();
const productsRepo = new ProductsRepository();

/**
 * @swagger
 * /api/wishlist/shared/{slug}:
 *   get:
 *     summary: Obter lista de desejos compartilhada por slug (público)
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug da lista de desejos compartilhada
 *     responses:
 *       200:
 *         description: Lista de desejos encontrada
 *       404:
 *         description: Lista de desejos não encontrada
 */
// IMPORTANT: Public routes must come before authenticated routes to avoid route conflicts
// GET /api/wishlist/shared/:slug - Get shared wishlist by slug (public, no auth required)
router.get('/shared/:slug', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { slug } = req.params;
    const hasAuth = !!req.headers.authorization;
    logger.debug('Public wishlist route accessed', { slug, hasAuth });
    
    const wishlistData = await wishlistRepo.getByShareSlug(slug);
    
    if (!wishlistData) {
      logger.debug('No wishlist found for slug', { slug });
      return res.status(404).json({ error: { message: 'Wishlist not found' } });
    }
    
    logger.debug('Found wishlist', { userId: wishlistData.user_id, productCount: wishlistData.product_ids.length });
    res.json(wishlistData);
  } catch (error: unknown) {
    logger.error('Error fetching shared wishlist', { error });
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const message = (error instanceof Error ? error.message : 'Internal server error');
    return res.status(statusCode).json({ error: { message } });
  }
});

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Obter lista de desejos do usuário autenticado
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de IDs de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 */
// GET /api/wishlist - Get user's wishlist
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    
    const productIds = await wishlistRepo.getProductIds(req.userId);
    res.json({ productIds });
  } catch (error: unknown) {
    next(error);
  }
});

// POST /api/wishlist - Add product to wishlist
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: { message: 'productId is required' } });
    }
    
    // Check if already wishlisted
    const isWishlisted = await wishlistRepo.isWishlisted(req.userId, productId);
    if (isWishlisted) {
      return res.status(400).json({ error: { message: 'Product already in wishlist' } });
    }
    
    const item = await wishlistRepo.add(req.userId, productId);
    res.status(201).json(item);
  } catch (error: unknown) {
    next(error);
  }
});

// DELETE /api/wishlist/:productId - Remove product from wishlist
router.delete('/:productId', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    
    const { productId } = req.params;
    await wishlistRepo.remove(req.userId, productId);
    res.status(204).send();
  } catch (error: unknown) {
    next(error);
  }
});

// POST /api/wishlist/share - Generate share slug for user's wishlist
router.post('/share', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    
    const slug = await wishlistRepo.generateShareSlug(req.userId);
    res.json({ shareSlug: slug });
  } catch (error: unknown) {
    next(error);
  }
});

// GET /api/wishlist/share - Get current user's share slug
router.get('/share', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    
    const slug = await wishlistRepo.generateShareSlug(req.userId);
    res.json({ shareSlug: slug });
  } catch (error: unknown) {
    next(error);
  }
});

// POST /api/wishlist/shared/:slug/buy-all - Buy all items from shared wishlist as a gift
router.post('/shared/:slug/buy-all', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    
    const { slug } = req.params;
    const { addressData, logisticsInfo, paymentMethod, subtotal, finalAmount } = req.body;
    
    // Get wishlist data
    const wishlistData = await wishlistRepo.getByShareSlug(slug);
    if (!wishlistData) {
      return res.status(404).json({ error: { message: 'Wishlist not found' } });
    }
    
    // Get products from wishlist
    const products = await productsRepo.getAllActive();
    const wishlistProducts = products.filter(p => wishlistData.product_ids.includes(p.id));
    
    // Build cart items from wishlist products
    const items = wishlistProducts.flatMap(product => {
      const variant = product.variants?.[0];
      if (!variant || variant.stock_quantity === 0) return [];
      
      return [{
        variant_id: variant.id,
        product_id: product.id,
        name: product.name,
        image: (variant.variant_images && variant.variant_images.length > 0) 
          ? variant.variant_images[0] 
          : (product.base_images && product.base_images.length > 0 ? product.base_images[0] : ''),
        size: variant.size || 'N/A',
        color_name: variant.color_name,
        color_hex: variant.color_hex || '#000',
        price: variant.retail_price,
        quantity: 1,
        sku: variant.sku
      }];
    });
    
    if (items.length === 0) {
      return res.status(400).json({ error: { message: 'No available products in wishlist' } });
    }
    
    // Create order as a gift for the wishlist owner
    const order = await orderService.createOrder(
      items,
      addressData,
      logisticsInfo,
      paymentMethod,
      subtotal,
      finalAmount,
      req.userId, // Buyer (gift giver)
      wishlistData.user_id, // Gift recipient
      slug // Wishlist slug
    );
    
    res.status(201).json(order);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
