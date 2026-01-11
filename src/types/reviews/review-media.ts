export interface ProductReviewMedia {
  id: string;
  review_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  file_size: number;
  file_name: string;
  created_at: string;
}
