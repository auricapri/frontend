import { Router, Request, Response, NextFunction } from 'express';
import { ProductsRepository } from '../../repositories/products.repository.js';
import { authenticate, optionalAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { env } from '../../config/env.js';
import { getRedisClientWithFallbackByKey } from '../../config/redis.js';
import { AuditLogsRepository } from '../../repositories/audit_logs.repository.js';

const router = Router();
const productsRepo = new ProductsRepository();
const auditLogsRepo = new AuditLogsRepository();
const hasRedis = !!(env.redis.primaryUrl || env.redis.secondaryUrl || env.redis.url);

const MAX_PRODUCTS_CACHE_BYTES = 120_000;
const MAX_PRODUCT_DETAIL_CACHE_BYTES = 50_000;

const ACTIVE_PRODUCTS_CACHE_KEY = 'cache:products:active:v1';
const ALL_PRODUCTS_CACHE_KEY = 'cache:products:all:v1';
const PRODUCT_DETAIL_CACHE_KEY = 'cache:products:detail:v1';
const PRODUCT_SLUG_CACHE_KEY = 'cache:products:slug:v1';

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lista todos os produtos ativos
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Limite de produtos a retornar
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Número de produtos a pular (pagination)
 *     responses:
 *       200:
 *         description: Lista de produtos ativos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/products - List all active products (public) with pagination
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    
    const cacheKey = `${ACTIVE_PRODUCTS_CACHE_KEY}:${limit}:${offset}`;
    
    if (hasRedis) {
      const cached = await getRedisClientWithFallbackByKey(
        cacheKey,
        async (redis) => await redis.get(cacheKey),
        async () => null
      );
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    const products = await productsRepo.findAll({ limit, offset });

    if (hasRedis) {
      const payload = JSON.stringify(products);
      if (Buffer.byteLength(payload, 'utf8') <= MAX_PRODUCTS_CACHE_BYTES) {
        await getRedisClientWithFallbackByKey(
          cacheKey,
          async (redis) => {
            await redis.setex(cacheKey, 60, payload);
          },
          async () => {}
        );
      }
    }
    res.json(products);
  } catch (error: unknown) {
    next(error);
  }
});

// GET /api/products/all - List all products including inactive (admin only)
router.get('/all', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (hasRedis) {
      const cached = await getRedisClientWithFallbackByKey(
        ALL_PRODUCTS_CACHE_KEY,
        async (redis) => await redis.get(ALL_PRODUCTS_CACHE_KEY),
        async () => null
      );
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    const products = await productsRepo.getAll();

    if (hasRedis) {
      const payload = JSON.stringify(products);
      if (Buffer.byteLength(payload, 'utf8') <= MAX_PRODUCTS_CACHE_BYTES) {
        await getRedisClientWithFallbackByKey(
          ALL_PRODUCTS_CACHE_KEY,
          async (redis) => {
            await redis.setex(ALL_PRODUCTS_CACHE_KEY, 30, payload);
          },
          async () => {}
        );
      }
    }
    res.json(products);
  } catch (error: unknown) {
    next(error);
  }
});

// GET /api/admin/products/all - Alias for admin (same as /all)
// This route is already covered by /all above, but we keep it for consistency

/**
 * @swagger
 * /api/products/by-ids:
 *   get:
 *     summary: Busca produtos por lista de IDs
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Lista de IDs separados por vírgula
 *         example: uuid1,uuid2,uuid3
 *     responses:
 *       200:
 *         description: Lista de produtos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
// GET /api/products/by-ids - Get products by list of IDs (public, for wishlist sharing)
router.get('/by-ids', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idsParam = req.query.ids as string;
    if (!idsParam) {
      return res.json([]);
    }

    const ids = idsParam.split(',').filter(id => id.trim().length > 0);
    if (ids.length === 0) {
      return res.json([]);
    }

    // Limita a 50 IDs por requisição para evitar abusos
    const limitedIds = ids.slice(0, 50);
    const products = await productsRepo.getByIds(limitedIds);
    res.json(products);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/slug/{slug}:
 *   get:
 *     summary: Obter produto por slug
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug do produto
 *         example: camiseta-basica-preta
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/products/slug/:slug - Get product by slug
router.get('/slug/:slug', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug;
    const cacheKey = `${PRODUCT_SLUG_CACHE_KEY}:${slug}`;

    if (hasRedis) {
      const cached = await getRedisClientWithFallbackByKey(
        cacheKey,
        async (redis) => await redis.get(cacheKey),
        async () => null
      );
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    const product = await productsRepo.getBySlug(slug);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    if (hasRedis) {
      const payload = JSON.stringify(product);
      if (Buffer.byteLength(payload, 'utf8') <= MAX_PRODUCT_DETAIL_CACHE_BYTES) {
        await getRedisClientWithFallbackByKey(
          cacheKey,
          async (redis) => {
            await redis.setex(cacheKey, 600, payload);
          },
          async () => {}
        );
      }
    }

    res.json(product);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obter produto por ID ou slug
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID (UUID) ou slug do produto
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/products/:id - Get product by ID
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const param = req.params.id;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
    const cacheKey = isUUID
      ? `${PRODUCT_DETAIL_CACHE_KEY}:${param}`
      : `${PRODUCT_SLUG_CACHE_KEY}:${param}`;

    if (hasRedis) {
      const cached = await getRedisClientWithFallbackByKey(
        cacheKey,
        async (redis) => await redis.get(cacheKey),
        async () => null
      );
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    let product = null;

    // Check if it's a slug request (contains hyphens, typical of slugs)
    if (param.includes('-') && !isUUID) {
      // Likely a slug, try slug first
      product = await productsRepo.getBySlug(param);
    }

    // Try as ID if not found by slug
    if (!product) {
      product = await productsRepo.getById(param);
    }

    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    if (hasRedis) {
      const payload = JSON.stringify(product);
      if (Buffer.byteLength(payload, 'utf8') <= MAX_PRODUCT_DETAIL_CACHE_BYTES) {
        await getRedisClientWithFallbackByKey(
          cacheKey,
          async (redis) => {
            await redis.setex(cacheKey, 600, payload);
          },
          async () => {}
        );
        // Also cache by the other key if needed
        if (isUUID && product.slug) {
          const slugCacheKey = `${PRODUCT_SLUG_CACHE_KEY}:${product.slug}`;
          await getRedisClientWithFallbackByKey(
            slugCacheKey,
            async (redis) => {
              await redis.setex(slugCacheKey, 600, payload);
            },
            async () => {}
          );
        }
      }
    }

    res.json(product);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Criar novo produto - Apenas Admin
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: object
 *                 properties:
 *                   pt:
 *                     type: string
 *                   en:
 *                     type: string
 *               slug:
 *                 type: object
 *                 properties:
 *                   pt:
 *                     type: string
 *                   en:
 *                     type: string
 *               description:
 *                 type: object
 *               is_active:
 *                 type: boolean
 *                 default: true
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer permissão de admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/products - Create product (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { variants, ...productData } = req.body;
    const product = await productsRepo.create(productData);

    let savedVariants: any[] = [];
    if (variants && Array.isArray(variants)) {
      savedVariants = await productsRepo.upsertVariants(product.id, variants);
    }

    if (savedVariants.length > 0) {
      const logs = savedVariants.flatMap(variant => {
        const entries: any[] = [];

        if (typeof variant.retail_price === 'number') {
          entries.push({
            user_id: req.userId || null,
            action: 'create_variant_price',
            table_name: 'product_variants',
            record_id: variant.id,
            ip_address: req.ip,
            metadata: {
              field: 'retail_price',
              new_price: variant.retail_price,
              product_id: variant.product_id,
            },
          });
        }

        if (typeof variant.wholesale_price === 'number') {
          entries.push({
            user_id: req.userId || null,
            action: 'create_variant_price',
            table_name: 'product_variants',
            record_id: variant.id,
            ip_address: req.ip,
            metadata: {
              field: 'wholesale_price',
              new_price: variant.wholesale_price,
              product_id: variant.product_id,
            },
          });
        }

        return entries;
      });

      if (logs.length > 0) {
        await Promise.all(logs.map(log => auditLogsRepo.create(log)));
      }
    }

    const createdProduct = await productsRepo.getById(product.id);
    if (hasRedis) {
      await getRedisClientWithFallbackByKey(
        ACTIVE_PRODUCTS_CACHE_KEY,
        async (redis) => {
          const keysToDelete = [ACTIVE_PRODUCTS_CACHE_KEY, ALL_PRODUCTS_CACHE_KEY];
          // Invalidate detail cache if product has slug
          if (createdProduct?.slug) {
            keysToDelete.push(`${PRODUCT_SLUG_CACHE_KEY}:${createdProduct.slug}`);
          }
          keysToDelete.push(`${PRODUCT_DETAIL_CACHE_KEY}:${product.id}`);
          await redis.del(...keysToDelete);
        },
        async () => {}
      );
    }
    res.status(201).json(createdProduct);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Atualizar produto - Apenas Admin
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: object
 *               description:
 *                 type: object
 *               is_active:
 *                 type: boolean
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer permissão de admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT /api/products/:id - Update product (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { variants, ...productData } = req.body;

    const existingProduct = await productsRepo.getById(req.params.id);
    const existingVariants = new Map<string, any>();
    if (existingProduct?.variants) {
      for (const v of existingProduct.variants as any[]) {
        if (v && v.id) {
          existingVariants.set(v.id, v);
        }
      }
    }

    await productsRepo.update(req.params.id, productData);

    let savedVariants: any[] = [];
    if (variants && Array.isArray(variants)) {
      savedVariants = await productsRepo.upsertVariants(req.params.id, variants);
    }

    if (savedVariants.length > 0) {
      const logs = savedVariants.flatMap(variant => {
        const entries: any[] = [];
        const previous = variant.id ? existingVariants.get(variant.id) : null;

        if (previous) {
          if (typeof variant.retail_price === 'number' && variant.retail_price !== previous.retail_price) {
            entries.push({
              user_id: req.userId || null,
              action: 'update_variant_price',
              table_name: 'product_variants',
              record_id: variant.id,
              ip_address: req.ip,
              metadata: {
                field: 'retail_price',
                old_price: previous.retail_price,
                new_price: variant.retail_price,
                product_id: variant.product_id,
              },
            });
          }

          if (typeof variant.wholesale_price === 'number' && variant.wholesale_price !== previous.wholesale_price) {
            entries.push({
              user_id: req.userId || null,
              action: 'update_variant_price',
              table_name: 'product_variants',
              record_id: variant.id,
              ip_address: req.ip,
              metadata: {
                field: 'wholesale_price',
                old_price: previous.wholesale_price,
                new_price: variant.wholesale_price,
                product_id: variant.product_id,
              },
            });
          }
        }

        return entries;
      });

      if (logs.length > 0) {
        await Promise.all(logs.map(log => auditLogsRepo.create(log)));
      }
    }

    const updatedProduct = await productsRepo.getById(req.params.id);
    if (hasRedis) {
      await getRedisClientWithFallbackByKey(
        ACTIVE_PRODUCTS_CACHE_KEY,
        async (redis) => {
          const keysToDelete = [ACTIVE_PRODUCTS_CACHE_KEY, ALL_PRODUCTS_CACHE_KEY];
          // Invalidate detail cache by ID
          keysToDelete.push(`${PRODUCT_DETAIL_CACHE_KEY}:${req.params.id}`);
          // Invalidate old slug cache if it changed
          if (existingProduct?.slug) {
            keysToDelete.push(`${PRODUCT_SLUG_CACHE_KEY}:${existingProduct.slug}`);
          }
          // Invalidate new slug cache
          if (updatedProduct?.slug && updatedProduct.slug !== existingProduct?.slug) {
            keysToDelete.push(`${PRODUCT_SLUG_CACHE_KEY}:${updatedProduct.slug}`);
          }
          await redis.del(...keysToDelete);
        },
        async () => {}
      );
    }
    res.json(updatedProduct);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/batch:
 *   delete:
 *     summary: Deletar múltiplos produtos - Apenas Admin
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *     responses:
 *       200:
 *         description: Resultado da operação de deleção em lote
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: array
 *                   items:
 *                     type: string
 *                 failed:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       error:
 *                         type: string
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer permissão de admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/products/batch - Delete multiple products (admin only)
router.delete('/batch', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: { message: 'ids must be a non-empty array' } });
    }

    // Get products before delete to know slugs for cache invalidation
    const productsToDelete = await productsRepo.getByIds(ids);

    const result = await productsRepo.deleteBatch(ids);
    if (hasRedis) {
      await getRedisClientWithFallbackByKey(
        ACTIVE_PRODUCTS_CACHE_KEY,
        async (redis) => {
          const keysToDelete = [ACTIVE_PRODUCTS_CACHE_KEY, ALL_PRODUCTS_CACHE_KEY];
          // Invalidate detail cache for each deleted product
          for (const id of ids) {
            keysToDelete.push(`${PRODUCT_DETAIL_CACHE_KEY}:${id}`);
          }
          // Invalidate slug cache for each deleted product
          for (const product of productsToDelete) {
            if (product?.slug) {
              keysToDelete.push(`${PRODUCT_SLUG_CACHE_KEY}:${product.slug}`);
            }
          }
          await redis.del(...keysToDelete);
        },
        async () => {}
      );
    }
    res.json(result);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Deletar produto - Apenas Admin
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     responses:
 *       204:
 *         description: Produto deletado com sucesso
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer permissão de admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get product before delete to know slug for cache invalidation
    const productToDelete = await productsRepo.getById(req.params.id);

    await productsRepo.delete(req.params.id);
    if (hasRedis) {
      await getRedisClientWithFallbackByKey(
        ACTIVE_PRODUCTS_CACHE_KEY,
        async (redis) => {
          const keysToDelete = [
            ACTIVE_PRODUCTS_CACHE_KEY,
            ALL_PRODUCTS_CACHE_KEY,
            `${PRODUCT_DETAIL_CACHE_KEY}:${req.params.id}`
          ];
          if (productToDelete?.slug) {
            keysToDelete.push(`${PRODUCT_SLUG_CACHE_KEY}:${productToDelete.slug}`);
          }
          await redis.del(...keysToDelete);
        },
        async () => {}
      );
    }
    res.status(204).send();
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
