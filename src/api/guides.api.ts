import { apiClient } from './client';
import { SizeGuide } from '../types';

export class GuidesApi {
  async getAll(): Promise<SizeGuide[]> {
    return apiClient.get<SizeGuide[]>('/guides');
  }

  async create(guide: Partial<SizeGuide>): Promise<SizeGuide> {
    return apiClient.post<SizeGuide>('/guides', guide);
  }

  async update(id: string, updates: Partial<SizeGuide>): Promise<SizeGuide> {
    return apiClient.put<SizeGuide>(`/guides/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/guides/${id}`);
  }
}

