import { cachedApiClient, CacheConfigs } from './cached-client';
import { Coupon } from '../types';

export class CachedCouponsApi {
  async getAllActive(): Promise<Coupon[]> {
    return cachedApiClient.get<Coupon[]>('/coupons', {
      cacheConfig: CacheConfigs.COUPONS,
      cacheKey: 'api:coupons:active',
    });
  }

  async getAll(): Promise<Coupon[]> {
    return cachedApiClient.get<Coupon[]>('/coupons/all', {
      cacheConfig: CacheConfigs.COUPONS,
      cacheKey: 'api:coupons:all',
    });
  }

  async getByCode(code: string): Promise<Coupon | null> {
    return cachedApiClient.get<Coupon | null>(`/coupons/code/${code}`, {
      cacheConfig: CacheConfigs.COUPONS,
      cacheKey: `api:coupons:code:${code}`,
    });
  }

  async create(coupon: Partial<Coupon>): Promise<Coupon> {
    return cachedApiClient.post<Coupon>('/coupons', coupon, {
      invalidatePattern: ['api:coupons:'],
    });
  }

  async update(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    return cachedApiClient.put<Coupon>(`/coupons/${id}`, updates, {
      invalidatePattern: ['api:coupons:'],
    });
  }

  async delete(id: string): Promise<void> {
    return cachedApiClient.delete<void>(`/coupons/${id}`, {
      invalidatePattern: ['api:coupons:'],
    });
  }
}

