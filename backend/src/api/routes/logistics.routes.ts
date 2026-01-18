import { Router, Response, NextFunction } from 'express';
import { LogisticsService } from '../../services/logistics.service.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();
const logisticsService = new LogisticsService();

router.post('/calculate-shipping', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { cep, addressData } = req.body;

    if (!cep || typeof cep !== 'string') {
      return res.status(400).json({ error: 'CEP string is required' });
    }

    const result = await logisticsService.calculateShipping(cep, addressData);
    res.json(result);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/shipping-options', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { cep, addressData } = req.body;

    if (!cep || typeof cep !== 'string') {
      return res.status(400).json({ error: 'CEP string is required' });
    }

    const options = await logisticsService.calculateShippingOptions(cep, addressData);
    res.json(options);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/freight-quotes', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { originCep, destinationCep, weightG, lengthCm, widthCm, heightCm, declaredValue } = req.body;

    if (!originCep || !destinationCep || !weightG) {
      return res.status(400).json({ error: 'originCep, destinationCep, and weightG are required' });
    }

    const quotes = await logisticsService.getFreightQuotes({
      originCep,
      destinationCep,
      weightG,
      lengthCm: lengthCm || 20,
      widthCm: widthCm || 15,
      heightCm: heightCm || 10,
      declaredValue: declaredValue || 100
    });

    res.json(quotes);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/address-by-cep', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { cep } = req.body;

    if (!cep || typeof cep !== 'string') {
      return res.status(400).json({ error: 'CEP string is required' });
    }

    const address = await logisticsService.fetchAddressByCep(cep);
    
    if (!address) {
      return res.status(404).json({ error: 'Address not found for CEP' });
    }

    res.json(address);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/state-from-cep/:cep', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { cep } = req.params;

    if (!cep) {
      return res.status(400).json({ error: 'CEP is required' });
    }

    const state = logisticsService.getStateFromCep(cep);
    res.json({ state });
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
