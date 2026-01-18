import { apiClient } from './client';
import { Supplier, SupplierReview } from '../types';

export class SuppliersApi {
  async getAll(activeOnly?: boolean): Promise<Supplier[]> {
    const query = activeOnly ? '?active=true' : '';
    return apiClient.get<Supplier[]>(`/suppliers${query}`);
  }

  async getById(id: string): Promise<Supplier | null> {
    return apiClient.get<Supplier | null>(`/suppliers/${id}`);
  }

  async create(supplier: Partial<Supplier>): Promise<Supplier> {
    return apiClient.post<Supplier>('/suppliers', supplier);
  }

  async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    return apiClient.put<Supplier>(`/suppliers/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/suppliers/${id}`);
  }

  async getReviews(supplierId: string): Promise<SupplierReview[]> {
    return apiClient.get<SupplierReview[]>(`/suppliers/${supplierId}/reviews`);
  }

  async createReview(supplierId: string, rating: number, comment?: string | null): Promise<SupplierReview> {
    return apiClient.post<SupplierReview>(`/suppliers/${supplierId}/reviews`, { rating, comment });
  }

  async toggleHelpful(reviewId: string): Promise<{ helpful_count: number; user_has_helped: boolean }> {
    return apiClient.post<{ helpful_count: number; user_has_helped: boolean }>(`/suppliers/reviews/${reviewId}/helpful`, {});
  }
}
