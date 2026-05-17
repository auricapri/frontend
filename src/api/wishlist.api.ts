import { apiClient } from './client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export interface WishlistResponse {
  productIds: string[];
  variantIds: Record<string, string>;
}

export class WishlistApi {
  async getAll(): Promise<WishlistResponse> {
    return apiClient.get<WishlistResponse>('/wishlist');
  }

  async add(productId: string, variantId?: string | null): Promise<void> {
    await apiClient.post('/wishlist', { productId, variantId: variantId ?? null });
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
  async getSharedWishlist(slug: string): Promise<{ user_id: string; owner_name: string | null; items: Array<{ product_id: string; variant_id: string | null }>; product_ids: string[] }> {
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

  async getDeliveryInfo(slug: string): Promise<{ hasAddress: boolean; city?: string; state?: string }> {
    const response = await fetch(`${API_BASE_URL}/wishlist/shared/${slug}/delivery-info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  async buyAllFromSharedWishlist(
    slug: string,
    orderData: {
      addressData: any; // allow: pragmatic any
      logisticsInfo: any; // allow: pragmatic any
      paymentMethod: 'credit_card' | 'pix';
      subtotal: number;
      finalAmount: number;
      productIds?: string[];
    }
  ): Promise<any> {
    return apiClient.post(`/wishlist/shared/${slug}/buy-all`, orderData);
  }
}

