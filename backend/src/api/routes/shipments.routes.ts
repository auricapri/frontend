import { Router, Response, NextFunction } from 'express';
import { ShipmentsRepository } from '../../repositories/shipments.repository.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();
const shipmentsRepo = new ShipmentsRepository();

// GET /api/shipments/order/:orderId - Get shipments for an order
router.get('/order/:orderId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const shipments = await shipmentsRepo.getByOrderId(req.params.orderId);
    res.json(shipments);
  } catch (error: unknown) {
    next(error);
  }
});

// PUT /api/shipments/:id - Update shipment (admin only)
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const shipment = await shipmentsRepo.update(req.params.id, updates);
    res.json(shipment);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

