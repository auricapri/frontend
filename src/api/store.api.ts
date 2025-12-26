import { apiClient } from './client';
import { Category, Banner, StoreConfig, SizeGuide } from '../types';

export class StoreApi {
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

