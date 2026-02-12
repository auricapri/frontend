import { apiClient } from './client';
import { FAQItem } from '../types';

export class FAQApi {
  /**
   * Get all active FAQs for public display (sorted by sort_order)
   */
  async getAll(): Promise<FAQItem[]> {
    return apiClient.get<FAQItem[]>('/faq');
  }

  /**
   * Admin method - returns all FAQs including inactive
   */
  async getAllAdmin(): Promise<FAQItem[]> {
    return apiClient.get<FAQItem[]>('/faq/admin');
  }

  async create(faq: Partial<FAQItem>): Promise<FAQItem> {
    return apiClient.post<FAQItem>('/faq', faq);
  }

  async update(id: string, updates: Partial<FAQItem>): Promise<FAQItem> {
    return apiClient.put<FAQItem>(`/faq/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/faq/${id}`);
  }

  /**
   * Reorder FAQs
   */
  async reorder(ids: string[]): Promise<void> {
    return apiClient.post<void>('/faq/reorder', { ids });
  }
}
