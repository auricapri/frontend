import { apiClient } from './client';
import { ProductReview, OrderItemForReview } from '../types';

export class ProductReviewsApi {
  async getOrderItemsForReview(orderId: string, userId?: string): Promise<OrderItemForReview[]> {
    if (userId) {
      return apiClient.get<OrderItemForReview[]>(`/product-reviews/order/${orderId}/items?user_id=${userId}`);
    }
    return apiClient.get<OrderItemForReview[]>(`/product-reviews/order/${orderId}/items`);
  }

  async getByProductId(productId: string): Promise<ProductReview[]> {
    return apiClient.get<ProductReview[]>(`/product-reviews/product/${productId}`);
  }

  async create(data: {
    order_id: string;
    order_item_id: string;
    product_id: string;
    variant_id?: string;
    rating: number;
    comment?: string;
    media?: File[];
    variant_size?: string;
    variant_color?: string;
    user_id?: string;
  }): Promise<ProductReview> {
    const formData = new FormData();
    formData.append('order_id', data.order_id);
    formData.append('order_item_id', data.order_item_id);
    formData.append('product_id', data.product_id);
    formData.append('rating', data.rating.toString());
    if (data.variant_id) {
      formData.append('variant_id', data.variant_id);
    }
    if (data.comment) {
      formData.append('comment', data.comment);
    }
    if (data.variant_size) {
      formData.append('variant_size', data.variant_size);
    }
    if (data.variant_color) {
      formData.append('variant_color', typeof data.variant_color === 'string' ? data.variant_color : JSON.stringify(data.variant_color));
    }
    if (data.user_id) {
      formData.append('user_id', data.user_id);
    }
    if (data.media) {
      data.media.forEach(file => {
        formData.append('media', file as any);
      });
    }

    return apiClient.post<ProductReview>('/product-reviews', formData);
  }

  async update(id: string, data: {
    rating?: number;
    comment?: string;
    media?: File[];
    remove_media_ids?: string[];
  }): Promise<ProductReview> {
    const formData = new FormData();
    if (data.rating !== undefined) {
      formData.append('rating', data.rating.toString());
    }
    if (data.comment !== undefined) {
      formData.append('comment', data.comment);
    }
    if (data.remove_media_ids) {
      formData.append('remove_media_ids', JSON.stringify(data.remove_media_ids));
    }
    if (data.media) {
      data.media.forEach(file => {
        formData.append('media', file as any);
      });
    }

    return apiClient.put<ProductReview>(`/product-reviews/${id}`, formData);
  }

  async toggleHelpful(id: string, userId?: string): Promise<{ helpful_count: number; user_has_helped: boolean }> {
    const formData = new FormData();
    if (userId) {
      formData.append('user_id', userId);
    }
    return apiClient.post<{ helpful_count: number; user_has_helped: boolean }>(`/product-reviews/${id}/helpful`, formData);
  }
}

