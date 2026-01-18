import { Router, Response, NextFunction } from 'express';
import { ReturnsRepository } from '../../repositories/returns.repository.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();
const returnsRepo = new ReturnsRepository();

// GET /api/returns - Get user's returns
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    const returns = await returnsRepo.getByUserId(req.userId);
    res.json(returns);
  } catch (error: unknown) {
    next(error);
  }
});

// GET /api/returns/order/:orderId - Get returns for an order
router.get('/order/:orderId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const returns = await returnsRepo.getByOrderId(req.params.orderId);
    res.json(returns);
  } catch (error: unknown) {
    next(error);
  }
});

// POST /api/returns - Create return request
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    const returnData = {
      ...req.body,
      user_id: req.userId
    };
    const returnRecord = await returnsRepo.create(returnData);
    res.status(201).json(returnRecord);
  } catch (error: unknown) {
    next(error);
  }
});

// PUT /api/returns/:id - Update return (admin or owner)
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const returnRecord = await returnsRepo.update(req.params.id, updates);
    res.json(returnRecord);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

