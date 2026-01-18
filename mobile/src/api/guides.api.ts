import { apiClient } from './client';
import { SizeGuide } from '../types';

export class GuidesApi {
  async getAll(): Promise<SizeGuide[]> {
    return apiClient.get<SizeGuide[]>('/guides');
  }

  async getById(id: string): Promise<SizeGuide | null> {
    return apiClient.get<SizeGuide | null>(`/guides/${id}`);
  }
}

