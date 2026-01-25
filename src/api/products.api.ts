import { apiClient } from './client';
import { Product } from '../types';

export class ProductsApi {
  async getAllActive(options?: { limit?: number; offset?: number }): Promise<Product[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    const query = params.toString();
    return apiClient.get<Product[]>(`/products${query ? `?${query}` : ''}`);
  }

  async getAll(options?: { limit?: number; offset?: number }): Promise<Product[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    const query = params.toString();
    return apiClient.get<Product[]>(`/products/all${query ? `?${query}` : ''}`);
  }

  /**
   * Admin method - no cache, returns all products directly from database
   */
  async getAllAdmin(): Promise<Product[]> {
    return apiClient.get<Product[]>('/products/all');
  }

  async getById(id: string): Promise<Product | null> {
    return apiClient.get<Product | null>(`/products/${id}`);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return apiClient.get<Product | null>(`/products/slug/${slug}`);
  }

  /**
   * Busca múltiplos produtos por IDs.
   * Mais eficiente que getAllActive() quando você só precisa de alguns produtos.
   */
  async getByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    // Usa query param para passar os IDs
    const params = new URLSearchParams();
    params.set('ids', ids.join(','));
    return apiClient.get<Product[]>(`/products/by-ids?${params.toString()}`);
  }

  async updateStock(_variantId: string, _quantity: number): Promise<void> {
    // This might need a specific endpoint or be part of variant update
    // For now, we'll need to implement this in the backend
    throw new Error('updateStock not yet implemented via API');
  }

  async create(product: Partial<Product>): Promise<Product> {
    return apiClient.post<Product>('/products', product);
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    return apiClient.put<Product>(`/products/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/products/${id}`);
  }

  async deleteBatch(ids: string[]): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
    return apiClient.delete<{ success: string[]; failed: Array<{ id: string; error: string }> }>('/products/batch', { ids });
  }
}
