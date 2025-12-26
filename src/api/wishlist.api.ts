import { apiClient } from './client';

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

  async getSharedWishlist(slug: string): Promise<{ user_id: string; product_ids: string[] }> {
    return apiClient.get<{ user_id: string; product_ids: string[] }>(`/wishlist/shared/${slug}`);
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

