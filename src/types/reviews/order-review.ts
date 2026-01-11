import { OrderReviewMedia } from './review-media';

export interface OrderReview {
  id: string;
  order_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  media?: OrderReviewMedia[];
  user_has_helped?: boolean;
}

export interface OrderReviewMedia {
  id: string;
  review_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  file_size: number;
  file_name: string;
  created_at: string;
}
