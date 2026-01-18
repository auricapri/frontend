import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { ProductReviewsService } from '../../services/product-reviews.service.js';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();
const service = new ProductReviewsService();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 20
  }
});

router.get('/order/:orderId/items', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId || req.body.user_id;
    if (!userId) {
      return res.status(401).json({ error: { message: 'User ID is required' } });
    }
    const items = await service.getOrderItemsForReview(req.params.orderId, userId);
    res.json(items);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/product/:productId', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = await service.getByProductId(req.params.productId, req.userId || undefined);
    res.json(reviews);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/', optionalAuth, upload.array('media', 20), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { order_id, order_item_id, product_id, variant_id, rating, comment, variant_size, variant_color, user_id } = req.body;
    const files = (req.files as Express.Multer.File[]) || [];

    if (!order_id || !order_item_id || !product_id || !rating) {
      return res.status(400).json({ error: { message: 'order_id, order_item_id, product_id and rating are required' } });
    }

    const userId = req.userId || user_id;
    if (!userId) {
      return res.status(401).json({ error: { message: 'User ID is required. Please provide user_id in request body or authenticate.' } });
    }

    const fileObjects: File[] = files.map(f => new File([f.buffer], f.originalname, { type: f.mimetype }));

    const review = await service.create(userId, {
      order_id,
      order_item_id,
      product_id,
      variant_id: variant_id || undefined,
      rating: parseInt(rating),
      comment: comment || undefined,
      variant_size: variant_size || undefined,
      variant_color: variant_color || undefined,
      media: fileObjects.length > 0 ? fileObjects : undefined
    });

    res.status(201).json(review);
  } catch (error: unknown) {
    next(error);
  }
});

router.put('/:id', authenticate, upload.array('media', 20), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { rating, comment, remove_media_ids } = req.body;
    const files = (req.files as Express.Multer.File[]) || [];
    const fileObjects: File[] = files.map(f => new File([f.buffer], f.originalname, { type: f.mimetype }));

    const review = await service.update(req.userId!, req.params.id, {
      rating: rating ? parseInt(rating) : undefined,
      comment: comment !== undefined ? comment : undefined,
      remove_media_ids: remove_media_ids ? (typeof remove_media_ids === 'string' ? JSON.parse(remove_media_ids) : remove_media_ids) : undefined,
      media: fileObjects.length > 0 ? fileObjects : undefined
    });

    res.json(review);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/:id/helpful', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId || req.body.user_id;
    if (!userId) {
      return res.status(401).json({ error: { message: 'User ID is required' } });
    }
    const result = await service.toggleHelpful(req.params.id, userId);
    res.json(result);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

