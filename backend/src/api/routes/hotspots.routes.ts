import { Router, Response, NextFunction } from 'express';
import { ProductHotspotsRepository } from '../../repositories/product-hotspots.repository.js';
import { authenticate, optionalAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();
const hotspotsRepo = new ProductHotspotsRepository();

/**
 * @swagger
 * /api/products/{productId}/hotspots:
 *   get:
 *     summary: Get all active hotspots for a product
 *     tags: [Hotspots]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of hotspots with populated variant data
 */
router.get('/:productId/hotspots', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const hotspots = await hotspotsRepo.getByProductId(productId);

    // Debug logging
    console.log(`[Hotspots API] Product ${productId}: Found ${hotspots.length} hotspots`);
    if (hotspots.length > 0) {
      console.log('[Hotspots API] Sample hotspot:', JSON.stringify({
        id: hotspots[0].id,
        has_linked_variant: !!hotspots[0].linked_variant,
        has_linked_product: !!hotspots[0].linked_product,
        linked_variant_id: hotspots[0].linked_variant_id
      }, null, 2));
    }

    res.json(hotspots);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{productId}/hotspots/admin:
 *   get:
 *     summary: Get all hotspots for a product (including inactive) - Admin only
 *     tags: [Hotspots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of all hotspots with populated variant data
 */
router.get('/:productId/hotspots/admin', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const hotspots = await hotspotsRepo.getAllByProductIdAdmin(productId);
    res.json(hotspots);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{productId}/hotspots:
 *   post:
 *     summary: Create a new hotspot - Admin only
 *     tags: [Hotspots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image_url
 *               - x_percent
 *               - y_percent
 *               - linked_variant_id
 *             properties:
 *               image_url:
 *                 type: string
 *               x_percent:
 *                 type: number
 *               y_percent:
 *                 type: number
 *               linked_variant_id:
 *                 type: string
 *               label:
 *                 type: object
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Hotspot created successfully
 */
router.post('/:productId/hotspots', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { image_url, x_percent, y_percent, linked_variant_id, label, is_active } = req.body;

    if (!image_url || x_percent === undefined || y_percent === undefined || !linked_variant_id) {
      return res.status(400).json({ error: { message: 'Missing required fields: image_url, x_percent, y_percent, linked_variant_id' } });
    }

    const hotspot = await hotspotsRepo.create({
      product_id: productId,
      image_url,
      x_percent,
      y_percent,
      linked_variant_id,
      label,
      is_active: is_active ?? true
    });

    res.status(201).json(hotspot);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{productId}/hotspots/batch:
 *   put:
 *     summary: Batch upsert all hotspots for a product - Admin only
 *     tags: [Hotspots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotspots
 *             properties:
 *               hotspots:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: All hotspots saved successfully
 */
router.put('/:productId/hotspots/batch', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { hotspots } = req.body;

    if (!Array.isArray(hotspots)) {
      return res.status(400).json({ error: { message: 'hotspots must be an array' } });
    }

    // Validate each hotspot
    const errors: string[] = [];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (let i = 0; i < hotspots.length; i++) {
      const h = hotspots[i];

      if (!h || typeof h !== 'object') {
        errors.push(`hotspots[${i}]: must be an object`);
        continue;
      }

      if (!h.image_url || typeof h.image_url !== 'string') {
        errors.push(`hotspots[${i}]: image_url is required and must be a string`);
      }

      if (typeof h.x_percent !== 'number' || h.x_percent < 0 || h.x_percent > 100) {
        errors.push(`hotspots[${i}]: x_percent must be a number between 0 and 100`);
      }

      if (typeof h.y_percent !== 'number' || h.y_percent < 0 || h.y_percent > 100) {
        errors.push(`hotspots[${i}]: y_percent must be a number between 0 and 100`);
      }

      if (!h.linked_variant_id || !uuidRegex.test(h.linked_variant_id)) {
        errors.push(`hotspots[${i}]: linked_variant_id is required and must be a valid UUID`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errors.map(e => ({ path: 'hotspots', message: e }))
        }
      });
    }

    const savedHotspots = await hotspotsRepo.upsertBatch(productId, hotspots);
    res.json(savedHotspots);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{productId}/hotspots/{hotspotId}:
 *   put:
 *     summary: Update a hotspot - Admin only
 *     tags: [Hotspots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: hotspotId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotspot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Hotspot updated successfully
 */
router.put('/:productId/hotspots/:hotspotId', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { hotspotId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.product_id;
    delete updates.created_at;
    delete updates.updated_at;
    delete updates.linked_variant;
    delete updates.linked_product;

    const hotspot = await hotspotsRepo.update(hotspotId, updates);
    res.json(hotspot);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{productId}/hotspots/{hotspotId}:
 *   delete:
 *     summary: Delete a hotspot - Admin only
 *     tags: [Hotspots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: hotspotId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotspot ID
 *     responses:
 *       204:
 *         description: Hotspot deleted successfully
 */
router.delete('/:productId/hotspots/:hotspotId', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { hotspotId } = req.params;
    await hotspotsRepo.delete(hotspotId);
    res.status(204).send();
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
