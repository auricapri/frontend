import { Router, Response, NextFunction } from 'express';
import { DeliveryService } from '../../services/delivery.service.js';
import { DeliveryRepository } from '../../repositories/delivery.repository.js';
import { authenticate, requireDelivery, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { supabase } from '../../config/supabase.js';
import logger from '../../config/logger.js';

const router = Router();
const deliveryService = new DeliveryService();
const deliveryRepo = new DeliveryRepository();

router.get('/orders', authenticate, requireDelivery, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const dateParam = req.query.date as string;
    const date = dateParam ? new Date(dateParam) : undefined;
    
    const groups = await deliveryService.getOrdersForDelivery(date);
    
    const groupsWithPickups = await Promise.all(
      groups.map(async (group) => {
        const pickups = await deliveryRepo.getPickupsBySupplier(group.supplier_id, req.userId);
        const pickupMap = new Map<string, any>();
        
        for (const pickup of pickups) {
          const key = `${pickup.order_id}_${pickup.order_item_id}`;
          pickupMap.set(key, pickup);
        }

        let pickedUpItems = 0;
        const itemsWithStatus = group.items.map(item => {
          const key = `${item.order_id}_${item.order_item_id || item.product_id}`;
          const pickup = pickupMap.get(key);
          const pickedUp = pickup && pickup.status === 'picked_up';
          
          if (pickedUp) {
            pickedUpItems += item.quantity;
          }

          return {
            ...item,
            picked_up: pickedUp,
            pickup_id: pickup?.id
          };
        });

        return {
          ...group,
          items: itemsWithStatus,
          picked_up_items: pickedUpItems
        };
      })
    );

    res.json(groupsWithPickups);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/pickups', authenticate, requireDelivery, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const pickups = await deliveryRepo.getPickupsByUser(req.userId);
    res.json(pickups);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/suppliers/:supplierId/orders', authenticate, requireDelivery, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { supplierId } = req.params;
    const group = await deliveryService.getSupplierOrders(supplierId, req.userId);

    if (!group) {
      return res.status(404).json({ error: { message: 'Supplier orders not found' } });
    }

    res.json(group);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/pickups', authenticate, requireDelivery, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { orderId, orderItemId } = req.body;

    if (!orderId || !orderItemId) {
      return res.status(400).json({ error: { message: 'orderId and orderItemId are required' } });
    }

    const pickup = await deliveryService.markProductAsPickedUp(orderId, orderItemId, req.userId);
    res.status(201).json(pickup);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/pickups/supplier/:supplierId', authenticate, requireDelivery, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { supplierId } = req.params;

    if (!supplierId) {
      return res.status(400).json({ error: { message: 'supplierId is required' } });
    }

    const results = await deliveryService.markAllSupplierItemsAsPickedUp(supplierId, req.userId);
    res.status(200).json(results);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/reports', authenticate, requireDelivery, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { orderId, orderItemId, mediaUrls, description } = req.body;

    if (!orderId || !orderItemId) {
      return res.status(400).json({ error: { message: 'orderId and orderItemId are required' } });
    }

    if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
      return res.status(400).json({ error: { message: 'At least one media URL is required' } });
    }

    const report = await deliveryService.reportProblem(
      orderId,
      orderItemId,
      req.userId,
      mediaUrls,
      description
    );

    res.status(201).json(report);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/reports', authenticate, requireDelivery, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const reports = await deliveryRepo.getReportsByUser(req.userId);
    res.json(reports);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/upload-media', authenticate, requireDelivery, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { file, fileName, contentType } = req.body;

    if (!file || !fileName) {
      return res.status(400).json({ error: { message: 'File and fileName are required' } });
    }

    const fileBuffer = Buffer.from(file, 'base64');
    const fileExt = fileName.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const filePath = `${req.userId}/${timestamp}-${randomStr}.${fileExt}`;

    const { error } = await supabase.storage
      .from('delivery-reports')
      .upload(filePath, fileBuffer, {
        contentType: contentType || 'image/jpeg',
        upsert: false
      });

    if (error) {
      logger.error('Storage upload error', { error });
      return res.status(500).json({ error: { message: 'Failed to upload file', details: error.message } });
    }

    const { data: urlData } = supabase.storage
      .from('delivery-reports')
      .getPublicUrl(filePath);

    res.json({ url: urlData.publicUrl, path: filePath });
  } catch (error: unknown) {
    logger.error('Upload error', { error });
    next(error);
  }
});

export default router;
