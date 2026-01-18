import { Router, Response, NextFunction } from 'express';
import { UserConsentsRepository } from '../../repositories/user_consents.repository.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();
const consentsRepo = new UserConsentsRepository();

// GET /api/user-consents - Get user's consents
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    const consents = await consentsRepo.getByUserId(req.userId);
    res.json(consents);
  } catch (error: unknown) {
    next(error);
  }
});

// POST /api/user-consents - Create consent
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    const consentData = {
      ...req.body,
      user_id: req.userId,
      ip_address: req.ip,
      user_agent: req.get('user-agent') || null
    };
    const consent = await consentsRepo.create(consentData);
    res.status(201).json(consent);
  } catch (error: unknown) {
    next(error);
  }
});

// GET /api/user-consents/check - Check if user has consent
router.get('/check', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    const { consentType, version } = req.query;
    if (!consentType || !version) {
      return res.status(400).json({ error: { message: 'consentType and version are required' } });
    }
    const hasConsent = await consentsRepo.hasConsent(
      req.userId,
      consentType as 'terms' | 'privacy' | 'marketing' | 'cookies',
      version as string
    );
    res.json({ hasConsent });
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

