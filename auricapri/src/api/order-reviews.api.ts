import { apiClient } from './client';
import { OrderReview } from '../types';

export class OrderReviewsApi {
  async getByOrderId(orderId: string): Promise<OrderReview[]> {
    return apiClient.get<OrderReview[]>(`/order-reviews/order/${orderId}`);
  }

  async getByUserId(): Promise<OrderReview[]> {
    return apiClient.get<OrderReview[]>('/order-reviews/user');
  }

  async create(data: {
    order_id: string;
    rating: number;
    comment?: string;
    media?: File[];
    user_id?: string;
  }): Promise<OrderReview> {
    const formData = new FormData();
    formData.append('order_id', data.order_id);
    formData.append('rating', data.rating.toString());
    if (data.comment) {
      formData.append('comment', data.comment);
    }
    if (data.user_id) {
      formData.append('user_id', data.user_id);
    }
    if (data.media) {
      data.media.forEach(file => {
        formData.append('media', file);
      });
    }

    return apiClient.post<OrderReview>('/order-reviews', formData);
  }

  async update(id: string, data: {
    rating?: number;
    comment?: string;
    media?: File[];
    remove_media_ids?: string[];
  }): Promise<OrderReview> {
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
        formData.append('media', file);
      });
    }

    return apiClient.put<OrderReview>(`/order-reviews/${id}`, formData);
  }

  async toggleHelpful(id: string): Promise<{ helpful_count: number; user_has_helped: boolean }> {
    return apiClient.post<{ helpful_count: number; user_has_helped: boolean }>(`/order-reviews/${id}/helpful`);
  }
}

