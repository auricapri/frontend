import React, { useState } from 'react';
import { Star, ThumbsUp, Edit2 } from 'lucide-react';
import { ProductReview } from '../../types';
import { ProductReviewsApi } from '../../api/product-reviews.api';

interface ProductReviewsListProps {
  reviews: ProductReview[];
  currentUserId?: string;
  onReviewUpdate?: () => void;
  onEdit?: (review: ProductReview) => void;
}

export const ProductReviewsList: React.FC<ProductReviewsListProps> = ({
  reviews,
  currentUserId,
  onReviewUpdate,
  onEdit
}) => {
  const [helpfulStates, setHelpfulStates] = useState<Record<string, { count: number; hasHelped: boolean }>>(
    reviews.reduce((acc, r) => {
      acc[r.id] = { count: r.helpful_count, hasHelped: r.user_has_helped || false };
      return acc;
    }, {} as Record<string, { count: number; hasHelped: boolean }>)
  );

  const handleHelpful = async (reviewId: string) => {
    if (!currentUserId) return;

    const api = new ProductReviewsApi();
    try {
      const result = await api.toggleHelpful(reviewId, currentUserId);
      setHelpfulStates(prev => ({
        ...prev,
        [reviewId]: { count: result.helpful_count, hasHelped: result.user_has_helped }
      }));
      if (onReviewUpdate) onReviewUpdate();
    } catch (error) {
      console.error('Error toggling helpful:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('pt-BR', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month}. ${year}`;
  };

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-neutral-100 pb-6 last:border-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= review.rating
                      ? 'fill-blue-500 text-blue-500'
                      : 'text-neutral-300'
                  }`}
                />
              ))}
              {review.variant_size && review.variant_color && (
                <span className="text-xs text-neutral-500 ml-2">
                  {review.variant_color} | {review.variant_size}
                </span>
              )}
            </div>
            <span className="text-sm text-neutral-500">{formatDate(review.created_at)}</span>
          </div>

          {review.media && review.media.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {review.media.map((media) => (
                <div key={media.id} className="flex-shrink-0">
                  {media.media_type === 'image' ? (
                    <img
                      src={media.media_url}
                      alt="Review"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={media.media_url}
                      className="w-24 h-24 object-cover rounded-lg"
                      controls
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {review.comment && (
            <p className="text-sm text-neutral-700 mb-4 whitespace-pre-wrap">{review.comment}</p>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => handleHelpful(review.id)}
              disabled={!currentUserId}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                helpfulStates[review.id]?.hasHelped
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>É útil</span>
              {helpfulStates[review.id]?.count > 0 && (
                <span className="font-medium">{helpfulStates[review.id].count}</span>
              )}
            </button>

            {currentUserId === review.user_id && onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="p-2 text-neutral-500 hover:text-black transition-colors"
                title="Editar avaliação"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

