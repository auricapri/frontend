import { AssetsRepository } from '../../repositories/assets.repository.js';
import { createCrudRouter } from './base-crud.router.js';

const assetsRepo = new AssetsRepository();

const router = createCrudRouter({
  repository: assetsRepo,
  basePath: '/assets',
  cache: {
    prefix: 'crud:assets',
    listTtlSeconds: 60,
    getTtlSeconds: 120,
    cacheControl: 'public, max-age=60, stale-while-revalidate=300'
  }
});

export default router;
