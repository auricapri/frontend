import { apiClient } from './client';
import { SizeGuide } from '../types';

export class GuidesApi {
  async getAll(): Promise<SizeGuide[]> {
    return apiClient.get<SizeGuide[]>('/guides');
  }

  /**
   * Admin method - no cache, returns all guides directly from database
   */
  async getAllAdmin(): Promise<SizeGuide[]> {
    return apiClient.get<SizeGuide[]>('/guides/admin');
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

