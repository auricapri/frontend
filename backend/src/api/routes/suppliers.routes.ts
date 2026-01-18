import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SuppliersService } from '../../services/suppliers.service.js';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { reviewRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

// SEGURANÇA: Schemas de validação
const CreateSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  is_active: z.boolean().optional().default(true),
});

const UpdateSupplierSchema = CreateSupplierSchema.partial();

const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

const router = Router();
const service = new SuppliersService();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.active === 'true';
    const suppliers = activeOnly 
      ? await service.getAllActive() 
      : await service.getAll();
    res.json(suppliers);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await service.getById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: { message: 'Supplier not found' } });
    }
    res.json(supplier);
  } catch (error: unknown) {
    next(error);
  }
});

// SEGURANÇA: Endpoints de CRUD de suppliers requerem admin + validação
router.post('/', authenticate, requireAdmin, validate({ body: CreateSupplierSchema }), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await service.create(req.body);
    res.status(201).json(supplier);
  } catch (error: unknown) {
    next(error);
  }
});

router.put('/:id', authenticate, requireAdmin, validate({ body: UpdateSupplierSchema }), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await service.update(req.params.id, req.body);
    res.json(supplier);
  } catch (error: unknown) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await service.delete(req.params.id);
    res.status(204).send();
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/:id/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await service.getReviews(req.params.id);
    res.json(reviews);
  } catch (error: unknown) {
    next(error);
  }
});

// SEGURANÇA: Reviews requerem autenticação + rate limiting + validação
router.post('/:id/reviews', reviewRateLimiter, authenticate, validate({ body: CreateReviewSchema }), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { rating, comment } = req.body;

    // SEGURANÇA: Usar apenas req.userId do token autenticado
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }

    const review = await service.createReview(req.userId, req.params.id, rating, comment || null);
    res.status(201).json(review);
  } catch (error: unknown) {
    next(error);
  }
});

// SEGURANÇA: Helpful toggle requer autenticação obrigatória
router.post('/reviews/:reviewId/helpful', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // SEGURANÇA: Usar apenas req.userId do token autenticado
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }
    const result = await service.toggleHelpful(req.params.reviewId, req.userId);
    res.json(result);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
