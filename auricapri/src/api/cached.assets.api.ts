import { cachedApiClient, CacheConfigs } from './cached-client';
import { Asset } from '../types';

export class CachedAssetsApi {
  async getAll(): Promise<Asset[]> {
    return cachedApiClient.get<Asset[]>('/assets', {
      cacheConfig: CacheConfigs.ASSETS,
      cacheKey: 'api:assets:all',
    });
  }

  async getById(id: string): Promise<Asset | null> {
    return cachedApiClient.get<Asset | null>(`/assets/${id}`, {
      cacheConfig: CacheConfigs.ASSETS,
      cacheKey: `api:assets:id:${id}`,
    });
  }

  async create(asset: Partial<Asset>): Promise<Asset> {
    return cachedApiClient.post<Asset>('/assets', asset, {
      invalidatePattern: ['api:assets:'],
    });
  }

  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    return cachedApiClient.put<Asset>(`/assets/${id}`, updates, {
      invalidatePattern: ['api:assets:'],
    });
  }

  async delete(id: string): Promise<void> {
    return cachedApiClient.delete<void>(`/assets/${id}`, {
      invalidatePattern: ['api:assets:'],
    });
  }
}

