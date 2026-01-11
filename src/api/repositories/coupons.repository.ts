import { Coupon } from '../../types';
import { CouponsApi } from '../coupons.api';

export class CouponsRepository {
  private api: CouponsApi;

  constructor() {
    this.api = new CouponsApi();
  }

  async create(coupon: Partial<Coupon>): Promise<Coupon> {
    return this.api.create(coupon);
  }

  async getAll(): Promise<Coupon[]> {
    return this.api.getAll();
  }

  async getByCode(code: string): Promise<Coupon | null> {
    return this.api.getByCode(code);
  }

  async update(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    return this.api.update(id, updates);
  }

  async delete(id: string): Promise<void> {
    return this.api.delete(id);
  }
}
