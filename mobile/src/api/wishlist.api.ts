import { apiClient } from './client';

// Get API base URL - use same logic as client.ts
const getApiBaseUrl = () => {
  // Check environment variable first
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // Default: backend runs on port 3002
  // Mobile web dev server runs on 3001, so we need to use 3002 for backend
  if (typeof window !== 'undefined') {
    // Web environment - backend on 3002
    return 'http://localhost:3002/api';
  }
  // Native environment - use localhost or device IP
  // In production, this should be set to the actual backend URL
  return 'https://backend-yso8.onrender.com/api';
};

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
    const API_BASE_URL = getApiBaseUrl();
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

