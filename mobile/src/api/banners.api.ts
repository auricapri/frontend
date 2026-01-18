import { apiClient } from './client';
import { Banner } from '../types';

export class BannersApi {
  async getAll(): Promise<Banner[]> {
    return apiClient.get<Banner[]>('/banners');
  }

  async getById(id: string): Promise<Banner | null> {
    return apiClient.get<Banner | null>(`/banners/${id}`);
  }
}

