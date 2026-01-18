/**
 * ProductReviewsList Component - React Native
 * List of product reviews
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Star, ThumbsUp, Edit2 } from '../ui/Icons';
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
    <View style={styles.container}>
      {reviews.map((review) => (
        <View key={review.id} style={styles.reviewItem}>
          <View style={styles.reviewHeader}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  color={star <= review.rating ? '#3B82F6' : '#D1D5DB'}
                  fill={star <= review.rating ? '#3B82F6' : 'none'}
                />
              ))}
              {review.variant_size && review.variant_color && (
                <Text style={styles.variantInfo}>
                  {review.variant_color} | {review.variant_size}
                </Text>
              )}
            </View>
            <Text style={styles.dateText}>{formatDate(review.created_at)}</Text>
          </View>

          {review.media && review.media.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaContainer}>
              {review.media.map((media) => (
                <View key={media.id} style={styles.mediaItem}>
                  {media.media_type === 'image' ? (
                    <Image source={{ uri: media.media_url }} style={styles.mediaImage} />
                  ) : (
                    <View style={styles.mediaImage}>
                      <Text style={styles.videoLabel}>Vídeo</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {review.comment && (
            <Text style={styles.comment}>{review.comment}</Text>
          )}

          <View style={styles.reviewActions}>
            <TouchableOpacity
              onPress={() => handleHelpful(review.id)}
              disabled={!currentUserId}
              style={[
                styles.helpfulButton,
                helpfulStates[review.id]?.hasHelped && styles.helpfulButtonActive
              ]}
            >
              <ThumbsUp size={16} color={helpfulStates[review.id]?.hasHelped ? '#3B82F6' : '#737373'} />
              <Text style={[
                styles.helpfulText,
                helpfulStates[review.id]?.hasHelped && styles.helpfulTextActive
              ]}>
                É útil
              </Text>
              {helpfulStates[review.id]?.count > 0 && (
                <Text style={styles.helpfulCount}>{helpfulStates[review.id].count}</Text>
              )}
            </TouchableOpacity>

            {currentUserId === review.user_id && onEdit && (
              <TouchableOpacity
                onPress={() => onEdit(review)}
                style={styles.editButton}
              >
                <Edit2 size={16} color="#737373" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  reviewItem: {
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  variantInfo: {
    fontSize: 12,
    color: '#737373',
    marginLeft: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#737373',
  },
  mediaContainer: {
    marginBottom: 12,
  },
  mediaItem: {
    marginRight: 8,
  },
  mediaImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    fontSize: 12,
    color: '#737373',
  },
  comment: {
    fontSize: 14,
    color: '#404040',
    marginBottom: 12,
    lineHeight: 20,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    gap: 6,
  },
  helpfulButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  helpfulText: {
    fontSize: 14,
    color: '#737373',
  },
  helpfulTextActive: {
    color: '#3B82F6',
  },
  helpfulCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  editButton: {
    padding: 8,
  },
});

