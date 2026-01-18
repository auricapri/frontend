import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { OrderReviewsService } from '../../services/order-reviews.service.js';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();
const service = new OrderReviewsService();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 20
  }
});

router.get('/order/:orderId', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = await service.getByOrderId(req.params.orderId, req.userId || undefined);
    res.json(reviews);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/user', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = await service.getByUserId(req.userId!);
    res.json(reviews);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/', optionalAuth, upload.array('media', 20), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { order_id, rating, comment, user_id } = req.body;
    const files = (req.files as Express.Multer.File[]) || [];

    if (!order_id || !rating) {
      return res.status(400).json({ error: { message: 'order_id and rating are required' } });
    }

    const userId = req.userId || user_id;
    if (!userId) {
      return res.status(401).json({ error: { message: 'User ID is required. Please provide user_id in request body or authenticate.' } });
    }

    const fileObjects: File[] = files.map(f => new File([f.buffer], f.originalname, { type: f.mimetype }));

    const review = await service.create(userId, {
      order_id,
      rating: parseInt(rating),
      comment: comment || undefined,
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

router.post('/:id/helpful', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await service.toggleHelpful(req.params.id, req.userId!);
    res.json(result);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

