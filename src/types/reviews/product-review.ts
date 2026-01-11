export interface ProductReviewMedia {
  id: string;
  review_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  file_size: number;
  file_name: string;
  created_at: string;
}

export interface ProductReview {
  id: string;
  order_id: string;
  order_item_id: string;
  product_id: string;
  variant_id?: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment: string | null;
  helpful_count: number;
  cashback_awarded: boolean;
  variant_size?: string;
  variant_color?: string;
  created_at: string;
  updated_at: string;
  media?: ProductReviewMedia[];
  user_has_helped?: boolean;
}

export interface OrderItemForReview {
  order_item_id: string;
  product_id: string;
  variant_id?: string;
  product_name: any;
  variant_size: string;
  variant_color: any;
  image: string;
  quantity: number;
  price: number;
  has_review: boolean;
  review?: ProductReview;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}
