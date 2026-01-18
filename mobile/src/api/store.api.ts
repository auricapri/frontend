import { apiClient } from './client';
import { Category, Banner, StoreConfig, SizeGuide, Product, Collection, Coupon, Asset } from '../types';

export type StoreBootstrapResponse = {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  banners: Banner[];
  config: StoreConfig | null;
  relations: Array<{ product_id: string; collection_id: string }>;
  coupons: Coupon[];
  assets: Asset[];
  sizeGuides: SizeGuide[];
};

export class StoreApi {
  async getBootstrap(): Promise<StoreBootstrapResponse> {
    return apiClient.get<StoreBootstrapResponse>('/store/bootstrap');
  }
  async getAllCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/store/categories');
  }

  async getAllBanners(): Promise<Banner[]> {
    return apiClient.get<Banner[]>('/store/banners');
  }

  async getConfig(): Promise<StoreConfig | null> {
    return apiClient.get<StoreConfig | null>('/store/config');
  }

  async getAllSizeGuides(): Promise<SizeGuide[]> {
    return apiClient.get<SizeGuide[]>('/store/size-guides');
  }

  async updateConfig(config: Partial<StoreConfig>): Promise<StoreConfig> {
    return apiClient.put<StoreConfig>('/store/config', config);
  }
}

