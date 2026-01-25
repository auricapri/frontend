import { apiClient } from './client';
import { Banner } from '../types';

export class BannersApi {
  async getAll(): Promise<Banner[]> {
    return apiClient.get<Banner[]>('/banners');
  }

  async getAllAdmin(): Promise<Banner[]> {
    return apiClient.get<Banner[]>('/banners/admin');
  }

  async create(banner: Partial<Banner>): Promise<Banner> {
    return apiClient.post<Banner>('/banners', banner);
  }

  async update(id: string, updates: Partial<Banner>): Promise<Banner> {
    return apiClient.put<Banner>(`/banners/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/banners/${id}`);
  }
}

