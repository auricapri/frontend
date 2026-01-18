import { apiClient } from './client';
import { ProductImageHotspot, HotspotInput } from '../types';

export class HotspotsApi {
  /**
   * Get all active hotspots for a product (public)
   */
  async getByProductId(productId: string): Promise<ProductImageHotspot[]> {
    return apiClient.get<ProductImageHotspot[]>(`/products/${productId}/hotspots`);
  }

  /**
   * Get all hotspots for a product including inactive (admin only)
   */
  async getAllByProductIdAdmin(productId: string): Promise<ProductImageHotspot[]> {
    return apiClient.get<ProductImageHotspot[]>(`/products/${productId}/hotspots/admin`);
  }

  /**
   * Create a new hotspot (admin only)
   */
  async create(productId: string, hotspot: HotspotInput): Promise<ProductImageHotspot> {
    return apiClient.post<ProductImageHotspot>(`/products/${productId}/hotspots`, hotspot);
  }

  /**
   * Batch save all hotspots for a product (admin only)
   * This replaces all existing hotspots
   */
  async saveBatch(productId: string, hotspots: HotspotInput[]): Promise<ProductImageHotspot[]> {
    return apiClient.put<ProductImageHotspot[]>(`/products/${productId}/hotspots/batch`, { hotspots });
  }

  /**
   * Update a hotspot (admin only)
   */
  async update(productId: string, hotspotId: string, updates: Partial<HotspotInput>): Promise<ProductImageHotspot> {
    return apiClient.put<ProductImageHotspot>(`/products/${productId}/hotspots/${hotspotId}`, updates);
  }

  /**
   * Delete a hotspot (admin only)
   */
  async delete(productId: string, hotspotId: string): Promise<void> {
    return apiClient.delete<void>(`/products/${productId}/hotspots/${hotspotId}`);
  }
}

// Singleton instance
export const hotspotsApi = new HotspotsApi();
