import { Router, Request, Response, NextFunction } from 'express';
import { StoreRepository } from '../../repositories/store.repository.js';
import { AssetsRepository } from '../../repositories/assets.repository.js';
import { CollectionsRepository } from '../../repositories/collections.repository.js';
import { CouponsRepository } from '../../repositories/coupons.repository.js';
import { getProductsRepository } from '../../repositories/products.repository.js';
import { authenticate, optionalAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { cacheJson, invalidateCacheByPrefix } from '../middleware/cache.middleware.js';
import { AuditLogsRepository } from '../../repositories/audit_logs.repository.js';
import { supabase } from '../../config/supabase.js';

const router = Router();
const storeRepo = new StoreRepository();
const collectionsRepo = new CollectionsRepository();
const couponsRepo = new CouponsRepository();
const assetsRepo = new AssetsRepository();
const productsRepo = getProductsRepository();
const auditLogsRepo = new AuditLogsRepository();

/**
 * @swagger
 * /api/store/categories:
 *   get:
 *     summary: Lista todas as categorias ativas
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// GET /api/store/categories - Get all active categories
router.get(
  '/categories',
  cacheJson({ prefix: 'store:categories', ttlSeconds: 600, cacheControl: 'public, max-age=600, stale-while-revalidate=1800' }),
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await storeRepo.getAllCategories();
    res.json(categories);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/categories/all', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await storeRepo.getAllCategoriesAdmin();
    res.json(categories);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/categories', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const created = await storeRepo.createCategory(req.body);
    void invalidateCacheByPrefix('store:categories');
    void invalidateCacheByPrefix('store:bootstrap');
    res.status(201).json(created);
  } catch (error: unknown) {
    next(error);
  }
});

router.put('/categories/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await storeRepo.updateCategory(req.params.id, req.body);
    void invalidateCacheByPrefix('store:categories');
    void invalidateCacheByPrefix('store:bootstrap');
    res.json(updated);
  } catch (error: unknown) {
    next(error);
  }
});

router.delete('/categories/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const categoryId = req.params.id;

    const { count: productCount, error: productsError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .is('deleted_at', null);

    if (productsError) throw productsError;

    if ((productCount || 0) > 0) {
      const err = new Error(`Não é possível excluir: categoria vinculada a ${productCount} produto(s).`) as any;
      err.statusCode = 409;
      err.code = 'CATEGORY_HAS_PRODUCTS';
      throw err;
    }

    const { count: dreamCardsCount, error: dreamCardsError } = await supabase
      .from('dream_cards')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (dreamCardsError) throw dreamCardsError;

    if ((dreamCardsCount || 0) > 0) {
      const err = new Error(`Não é possível excluir: categoria vinculada a ${dreamCardsCount} item(ns) no Dream Board.`) as any;
      err.statusCode = 409;
      err.code = 'CATEGORY_HAS_DREAM_CARDS';
      throw err;
    }

    await storeRepo.deleteCategory(categoryId);

    // record_id expects UUID, but category IDs are text - store in metadata instead
    await auditLogsRepo.create({
      user_id: req.userId || null,
      action: 'delete_category',
      table_name: 'categories',
      record_id: null,
      ip_address: req.ip,
      metadata: {
        category_id: categoryId,
      },
    });

    void invalidateCacheByPrefix('store:categories');
    void invalidateCacheByPrefix('store:bootstrap');

    res.status(204).send();
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/store/banners:
 *   get:
 *     summary: Lista todos os banners ativos
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de banners
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// GET /api/store/banners - Get all active banners
router.get(
  '/banners',
  cacheJson({ prefix: 'store:banners', ttlSeconds: 600, cacheControl: 'public, max-age=600, stale-while-revalidate=1800' }),
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await storeRepo.getAllBanners();
    res.json(banners);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/store/config:
 *   get:
 *     summary: Obter configuração da loja
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuração da loja
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// GET /api/store/config - Get store configuration
router.get(
  '/config',
  cacheJson({ prefix: 'store:config', ttlSeconds: 120, cacheControl: 'public, max-age=120, stale-while-revalidate=600' }),
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await storeRepo.getConfig();
    res.json(config);
  } catch (error: unknown) {
    next(error);
  }
});

// GET /api/store/size-guides - Get all size guides
router.get(
  '/size-guides',
  cacheJson({ prefix: 'store:size-guides', ttlSeconds: 3600, cacheControl: 'public, max-age=3600, stale-while-revalidate=7200' }),
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guides = await storeRepo.getAllSizeGuides();
    res.json(guides);
  } catch (error: unknown) {
    next(error);
  }
});

router.get(
  '/bootstrap',
  cacheJson({ prefix: 'store:bootstrap', ttlSeconds: 300, cacheControl: 'public, max-age=300, stale-while-revalidate=900' }),
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [products, categories, collections, banners, config, relations, coupons, assets, sizeGuides] = await Promise.all([
        productsRepo.getAllActive(),
        storeRepo.getAllCategories(),
        collectionsRepo.getAllActive(),
        storeRepo.getAllBanners(),
        storeRepo.getConfig(),
        collectionsRepo.getCollectionProducts(),
        couponsRepo.getAllActive(),
        assetsRepo.getAll(),
        storeRepo.getAllSizeGuides(),
      ]);

      res.json({
        products,
        categories,
        collections,
        banners,
        config,
        relations,
        coupons,
        assets,
        sizeGuides,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// PUT /api/store/config - Update store configuration (admin only)
router.put('/config', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const config = await storeRepo.updateConfig(req.body);
    void invalidateCacheByPrefix('store:bootstrap');
    res.json(config);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
