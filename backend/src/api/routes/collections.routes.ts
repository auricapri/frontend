import { Request, Response, NextFunction } from 'express';
import { CollectionsRepository } from '../../repositories/collections.repository.js';
import { authenticate, optionalAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { cacheJson } from '../middleware/cache.middleware.js';
import { createCrudRouter } from './base-crud.router.js';
import { supabase } from '../../config/supabase.js';
import { AuditLogsRepository } from '../../repositories/audit_logs.repository.js';

const collectionsRepo = new CollectionsRepository();
const auditLogsRepo = new AuditLogsRepository();

const router = createCrudRouter({
  repository: collectionsRepo,
  basePath: '/collections',
  cache: {
    prefix: 'crud:collections',
    listTtlSeconds: 30,
    getTtlSeconds: 60,
    cacheControl: 'public, max-age=30, stale-while-revalidate=60'
  },
  customRoutes: [
    {
      method: 'delete',
      path: '/:id',
      middleware: [authenticate, requireAdmin],
      handler: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
          const r = req as AuthenticatedRequest;
          const collectionId = req.params.id;

          const { data: existing, error: existingError } = await supabase
            .from('collections')
            .select('id, slug, is_active, deleted_at')
            .eq('id', collectionId)
            .maybeSingle();

          if (existingError) throw existingError;
          if (!existing) {
            res.status(404).json({ error: { message: 'Resource not found' } });
            return;
          }

          if ((existing as any).deleted_at) {
            res.status(204).send();
            return;
          }

          const { count: dependencyCount, error: depError } = await supabase
            .from('collection_products')
            .select('product_id', { count: 'exact', head: true })
            .eq('collection_id', collectionId);

          if (depError) throw depError;

          if ((dependencyCount || 0) > 0) {
            const err = new Error(`Não é possível excluir: coleção vinculada a ${dependencyCount} produto(s).`) as any;
            err.statusCode = 409;
            err.code = 'COLLECTION_HAS_PRODUCTS';
            throw err;
          }

          const { error: updateError } = await supabase
            .from('collections')
            .update({ deleted_at: new Date().toISOString(), deleted_by: r.userId || null, is_active: false })
            .eq('id', collectionId);

          if (updateError) throw updateError;

          // record_id expects UUID, but collection IDs are text - store in metadata instead
          await auditLogsRepo.create({
            user_id: r.userId || null,
            action: 'delete_collection',
            table_name: 'collections',
            record_id: null,
            ip_address: req.ip,
            metadata: {
              collection_id: collectionId,
              slug: (existing as any).slug,
            },
          });

          res.status(204).send();
        } catch (error: unknown) {
          next(error);
        }
      },
    },
    {
      method: 'get',
      path: '/products/relations',
      middleware: [
        cacheJson({ prefix: 'collections:relations', ttlSeconds: 30, cacheControl: 'public, max-age=30, stale-while-revalidate=60' }),
        optionalAuth
      ],
      handler: async (req: Request, res: Response, next: NextFunction) => {
        try {
          const relations = await collectionsRepo.getCollectionProducts();
          res.json(relations);
        } catch (error: unknown) {
          next(error);
        }
      }
    }
  ]
});

export default router;
