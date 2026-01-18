import { cachedApiClient, CacheConfigs } from './cached-client';
import { Product } from '../types';

export class CachedProductsApi {
  async getAllActive(): Promise<Product[]> {
    return cachedApiClient.get<Product[]>('/products', {
      cacheConfig: CacheConfigs.PRODUCTS,
      cacheKey: 'api:products:active',
    });
  }

  async getAll(): Promise<Product[]> {
    return cachedApiClient.get<Product[]>('/products/all', {
      cacheConfig: CacheConfigs.PRODUCTS,
      cacheKey: 'api:products:all',
    });
  }

  async getById(id: string): Promise<Product | null> {
    return cachedApiClient.get<Product | null>(`/products/${id}`, {
      cacheConfig: CacheConfigs.PRODUCT_DETAIL,
      cacheKey: `api:products:id:${id}`,
    });
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return cachedApiClient.get<Product | null>(`/products/slug/${slug}`, {
      cacheConfig: CacheConfigs.PRODUCT_DETAIL,
      cacheKey: `api:products:slug:${slug}`,
    });
  }

  async create(product: Partial<Product>): Promise<Product> {
    return cachedApiClient.post<Product>('/products', product, {
      invalidatePattern: ['api:products:'],
    });
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    return cachedApiClient.put<Product>(`/products/${id}`, updates, {
      invalidatePattern: ['api:products:'],
    });
  }

  async delete(id: string): Promise<void> {
    return cachedApiClient.delete<void>(`/products/${id}`, {
      invalidatePattern: ['api:products:'],
    });
  }
}

