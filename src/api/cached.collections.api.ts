import { cachedApiClient, CacheConfigs } from './cached-client';
import { Collection } from '../types';

export class CachedCollectionsApi {
  async getAllActive(): Promise<Collection[]> {
    return cachedApiClient.get<Collection[]>('/collections', {
      cacheConfig: CacheConfigs.COLLECTIONS,
      cacheKey: 'api:collections:active',
    });
  }

  async getAll(): Promise<Collection[]> {
    return cachedApiClient.get<Collection[]>('/collections/all', {
      cacheConfig: CacheConfigs.COLLECTIONS,
      cacheKey: 'api:collections:all',
    });
  }

  async getById(id: string): Promise<Collection | null> {
    return cachedApiClient.get<Collection | null>(`/collections/${id}`, {
      cacheConfig: CacheConfigs.COLLECTIONS,
      cacheKey: `api:collections:id:${id}`,
    });
  }

  async getCollectionProducts(): Promise<Array<{ product_id: string; collection_id: string }>> {
    return cachedApiClient.get<Array<{ product_id: string; collection_id: string }>>('/collections/products/relations', {
      cacheConfig: CacheConfigs.COLLECTION_PRODUCTS,
      cacheKey: 'api:collections:products:relations',
    });
  }

  async create(collection: Partial<Collection>): Promise<Collection> {
    return cachedApiClient.post<Collection>('/collections', collection, {
      invalidatePattern: ['api:collections:'],
    });
  }

  async update(id: string, updates: Partial<Collection>): Promise<Collection> {
    return cachedApiClient.put<Collection>(`/collections/${id}`, updates, {
      invalidatePattern: ['api:collections:'],
    });
  }
}

