import { useState, useEffect, useMemo } from 'react';
import { ProductReview } from '../../../../types';
import { ProductReviewsApi } from '../../../../api/product-reviews.api';

export function useProductReviews(productId: string) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const reviewsApi = useMemo(() => new ProductReviewsApi(), []);

  useEffect(() => {
    const loadReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const productReviews: ProductReview[] = await reviewsApi.getByProductId(productId);
        setReviews(productReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    loadReviews();
  }, [productId]);

  const onAddReview = (newReview: ProductReview) => {
    setReviews(prev => [newReview, ...prev]);
  };

  return {
    reviews,
    isLoadingReviews,
    onAddReview,
  };
}
