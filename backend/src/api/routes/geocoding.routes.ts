import { Router, Response, NextFunction } from 'express';
import { GeocodingService } from '../../services/geocoding.service.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();
const geocodingService = new GeocodingService();

router.post('/address', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address string is required' });
    }

    const result = await geocodingService.geocodeAddress(address);
    res.json(result);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/directions', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { origin, destination, profile } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination coordinates are required' });
    }

    if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
      return res.status(400).json({ error: 'Invalid coordinates format' });
    }

    const result = await geocodingService.getDirectionsRoute(
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
      profile || 'driving'
    );

    res.json(result);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/directions-with-steps', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { origin, destination, profile } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination coordinates are required' });
    }

    if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
      return res.status(400).json({ error: 'Invalid coordinates format' });
    }

    const result = await geocodingService.getDirectionsRouteWithSteps(
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
      profile || 'driving'
    );

    res.json(result);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
