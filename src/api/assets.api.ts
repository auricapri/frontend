import { apiClient } from './client';
import { Asset } from '../types';

export class AssetsApi {
  async getAll(): Promise<Asset[]> {
    return apiClient.get<Asset[]>('/assets');
  }

  async getById(id: string): Promise<Asset | null> {
    return apiClient.get<Asset | null>(`/assets/${id}`);
  }

  async updateStock(assetId: string, quantity: number): Promise<void> {
    // This might need a specific endpoint
    throw new Error('updateStock not yet implemented via API');
  }

  async create(asset: Partial<Asset>): Promise<Asset> {
    return apiClient.post<Asset>('/assets', asset);
  }

  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    return apiClient.put<Asset>(`/assets/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/assets/${id}`);
  }
}

