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
