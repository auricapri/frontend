import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { cacheJson, invalidateCacheByPrefix } from '../middleware/cache.middleware.js';

interface CrudRepository<T> {
  getAll(options?: { limit?: number; offset?: number }): Promise<T[]>;
  getAllActive?(options?: { limit?: number; offset?: number }): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

interface CrudRouterOptions<T> {
  repository: CrudRepository<T>;
  basePath: string;
  requireAuthForList?: boolean;
  requireAuthForGet?: boolean;
  requireAdminForList?: boolean;
  requireAdminForGet?: boolean;
  cache?: {
    prefix: string;
    listTtlSeconds: number;
    getTtlSeconds: number;
    cacheControl: string;
  };
  customRoutes?: Array<{
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    path: string;
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
  }>;
}

export function createCrudRouter<T>(options: CrudRouterOptions<T>): Router {
  const router = Router();
  const {
    repository,
    requireAuthForList = false,
    requireAuthForGet = false,
    requireAdminForList = false,
    requireAdminForGet = false,
    cache,
    customRoutes = []
  } = options;

  for (const customRoute of customRoutes) {
    const middleware = customRoute.middleware || [];
    router[customRoute.method](customRoute.path, ...middleware, customRoute.handler);
  }

  const listMiddleware = [];
  if (requireAuthForList) listMiddleware.push(authenticate);
  if (requireAdminForList) listMiddleware.push(requireAdmin);

  const getMiddleware = [];
  if (requireAuthForGet) getMiddleware.push(authenticate);
  if (requireAdminForGet) getMiddleware.push(requireAdmin);

  router.get(
    '/',
    ...(cache ? [cacheJson({ prefix: `${cache.prefix}:list`, ttlSeconds: cache.listTtlSeconds, cacheControl: cache.cacheControl })] : []),
    ...(listMiddleware.length > 0 ? listMiddleware : [optionalAuth]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
        const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
        
        const items = repository.getAllActive
          ? await repository.getAllActive({ limit, offset })
          : await repository.getAll({ limit, offset });
        res.json(items);
      } catch (error: unknown) {
        next(error);
      }
    }
  );

  router.get(
    '/all',
    authenticate,
    requireAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
        const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
        
        const items = await repository.getAll({ limit, offset });
        res.json(items);
      } catch (error: unknown) {
        next(error);
      }
    }
  );

  router.get(
    '/:id',
    ...(cache ? [cacheJson({ prefix: `${cache.prefix}:get`, ttlSeconds: cache.getTtlSeconds, cacheControl: cache.cacheControl })] : []),
    ...(getMiddleware.length > 0 ? getMiddleware : [optionalAuth]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const item = await repository.getById(req.params.id);
        if (!item) {
          return res.status(404).json({ error: { message: 'Resource not found' } });
        }
        res.json(item);
      } catch (error: unknown) {
        next(error);
      }
    }
  );

  router.post(
    '/',
    authenticate,
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const item = await repository.create(req.body);
        if (cache) {
          void invalidateCacheByPrefix(cache.prefix);
        }
        res.status(201).json(item);
      } catch (error: unknown) {
        next(error);
      }
    }
  );

  router.put(
    '/:id',
    authenticate,
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const item = await repository.update(req.params.id, req.body);
        if (cache) {
          void invalidateCacheByPrefix(cache.prefix);
        }
        res.json(item);
      } catch (error: unknown) {
        next(error);
      }
    }
  );

  router.delete(
    '/:id',
    authenticate,
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        await repository.delete(req.params.id);
        if (cache) {
          void invalidateCacheByPrefix(cache.prefix);
        }
        res.status(204).send();
      } catch (error: unknown) {
        next(error);
      }
    }
  );

  return router;
}
