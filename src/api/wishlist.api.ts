import { apiClient } from './client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface WishlistResponse {
  productIds: string[];
}

export class WishlistApi {
  async getAll(): Promise<string[]> {
    const response = await apiClient.get<WishlistResponse>('/wishlist');
    return response.productIds;
  }

  async add(productId: string): Promise<void> {
    await apiClient.post('/wishlist', { productId });
  }

  async remove(productId: string): Promise<void> {
    await apiClient.delete(`/wishlist/${productId}`);
  }

  async getShareSlug(): Promise<string> {
    const response = await apiClient.get<{ shareSlug: string }>('/wishlist/share');
    return response.shareSlug;
  }

  /**
   * Get shared wishlist by slug - PUBLIC route, no authentication required
   * Uses direct fetch to avoid token issues
   */
  async getSharedWishlist(slug: string): Promise<{ user_id: string; product_ids: string[] }> {
    const response = await fetch(`${API_BASE_URL}/wishlist/shared/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: { message: `HTTP ${response.status}: ${response.statusText}` },
      }));
      throw new Error(error.error?.message || 'Failed to fetch shared wishlist');
    }

    return response.json();
  }

  async buyAllFromSharedWishlist(
    slug: string,
    orderData: {
      addressData: any;
      logisticsInfo: any;
      paymentMethod: 'credit_card' | 'pix';
      subtotal: number;
      finalAmount: number;
    }
  ): Promise<any> {
    return apiClient.post(`/wishlist/shared/${slug}/buy-all`, orderData);
  }
}

