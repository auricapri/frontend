import { apiClient } from './client';
import { Collection } from '../types';

export class CollectionsApi {
  async getAllActive(): Promise<Collection[]> {
    return apiClient.get<Collection[]>('/collections');
  }

  async getAll(): Promise<Collection[]> {
    return apiClient.get<Collection[]>('/collections/all');
  }

  /**
   * Admin method - no cache, returns all collections directly from database
   */
  async getAllAdmin(): Promise<Collection[]> {
    return apiClient.get<Collection[]>('/collections/all');
  }

  async getById(id: string): Promise<Collection | null> {
    return apiClient.get<Collection | null>(`/collections/${id}`);
  }

  async getCollectionProducts(): Promise<Array<{ product_id: string; collection_id: string }>> {
    return apiClient.get<Array<{ product_id: string; collection_id: string }>>('/collections/products/relations');
  }

  async create(collection: Partial<Collection>): Promise<Collection> {
    return apiClient.post<Collection>('/collections', collection);
  }

  async update(id: string, updates: Partial<Collection>): Promise<Collection> {
    return apiClient.put<Collection>(`/collections/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/collections/${id}`);
  }

  /**
   * Update the collections associated with a product
   * @param productId - The product ID
   * @param collectionIds - Array of collection IDs to associate with the product
   */
  async updateProductCollections(productId: string, collectionIds: string[]): Promise<void> {
    return apiClient.put<void>(`/collections/product-relations/${productId}`, { collectionIds });
  }
}
