import { apiClient } from './client';
import { Coupon } from '../types';

export class CouponsApi {
  async getAllActive(): Promise<Coupon[]> {
    return apiClient.get<Coupon[]>('/coupons');
  }

  async getAll(): Promise<Coupon[]> {
    return apiClient.get<Coupon[]>('/coupons/all');
  }

  /**
   * Admin method - no cache, returns all coupons directly from database
   */
  async getAllAdmin(): Promise<Coupon[]> {
    return apiClient.get<Coupon[]>('/coupons/all');
  }

  async getByCode(code: string): Promise<Coupon | null> {
    return apiClient.get<Coupon | null>(`/coupons/code/${code}`);
  }

  async create(coupon: Partial<Coupon>): Promise<Coupon> {
    return apiClient.post<Coupon>('/coupons', coupon);
  }

  async update(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    return apiClient.put<Coupon>(`/coupons/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/coupons/${id}`);
  }
}
