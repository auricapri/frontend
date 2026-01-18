import { Router } from 'express';
import { NotificationsRepository } from '../../repositories/notifications.repository.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();
const notificationsRepo = new NotificationsRepository();

// GET /api/notifications - Get user's notifications
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await notificationsRepo.getByUserId(req.userId, unreadOnly);
    res.json(notifications);
  } catch (error: unknown) {
    next(error);
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    const notification = await notificationsRepo.markAsRead(req.params.id);
    res.json(notification);
  } catch (error: unknown) {
    next(error);
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    await notificationsRepo.markAllAsRead(req.userId);
    res.json({ success: true });
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

