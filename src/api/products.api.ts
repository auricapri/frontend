import { apiClient } from './client';
import { Product } from '../types';

export class ProductsApi {
  async getAllActive(): Promise<Product[]> {
    return apiClient.get<Product[]>('/products');
  }

  async getAll(): Promise<Product[]> {
    return apiClient.get<Product[]>('/products/all');
  }

  async getById(id: string): Promise<Product | null> {
    return apiClient.get<Product | null>(`/products/${id}`);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return apiClient.get<Product | null>(`/products/slug/${slug}`);
  }

  async updateStock(variantId: string, quantity: number): Promise<void> {
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
}

