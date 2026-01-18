/**
 * ProductReviews Component - React Native
 * Adapted from web version
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Star, CheckCircle2, MessageSquare, Loader2, User } from '../ui';
import { Review, UserProfile, Order } from '../../types';
import { Button } from '../ui';

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  user: UserProfile | null;
  userOrders?: Order[];
  t: (key: string) => any;
  onAddReview: (review: Partial<Review>) => Promise<void>;
  isLoading?: boolean;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, reviews, user, userOrders = [], t, onAddReview, isLoading }) => {
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user has paid and delivered orders with this product
  const hasPaidAndDeliveredOrderWithProduct = (): boolean => {
    if (!user || !userOrders || userOrders.length === 0) return false;
    
    // Filter orders that are delivered AND paid (have payment_method and status is delivered)
    const paidAndDeliveredOrders = userOrders.filter(order => 
      order.status === 'delivered' && 
      order.payment_method && 
      order.payment_method !== null &&
      order.status !== 'pending' &&
      order.status !== 'cancelled'
    );
    
    // Check if any of these orders contain the product
    return paidAndDeliveredOrders.some(order => 
      order.items && order.items.some(item => item.product_id === productId)
    );
  };

  const canReview = (): boolean => {
    return !!user && hasPaidAndDeliveredOrderWithProduct();
  };

  const handleWriteReview = () => {
    if (!user) {
      Alert.alert(
        'Login Necessário',
        'Você precisa estar logado para avaliar um produto.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!hasPaidAndDeliveredOrderWithProduct()) {
      Alert.alert(
        'Avaliação Não Disponível',
        'Você só pode avaliar produtos de pedidos pagos e entregues.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsWriting(true);
  };

  const handleSubmit = async () => {
    if (!user || !canReview()) {
      Alert.alert(
        'Erro',
        'Você não pode avaliar este produto.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddReview({
        product_id: productId,
        user_id: user.id,
        user_name: user.full_name,
        rating,
        comment,
        is_verified_purchase: true,
      });
      setIsWriting(false);
      setComment('');
      setRating(5);
    } catch (err) {
      Alert.alert('Erro', 'Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.label}>{t('product.reviews')}</Text>
          <View style={styles.ratingDisplay}>
            <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
            <View style={styles.starsContainer}>
              <View style={styles.starsRow}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} color="#000000" filled={i < Math.round(averageRating)} />
                ))}
              </View>
              <Text style={styles.reviewCount}>{reviews.length} total evaluations</Text>
            </View>
          </View>
        </View>

        {user && !isWriting && canReview() && (
          <Button onPress={handleWriteReview} variant="primary" size="md">
            {t('product.writeReview')}
          </Button>
        )}
      </View>

      {isWriting && (
        <View style={styles.formContainer}>
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>{t('product.rating')}</Text>
            <View style={styles.starsInputRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Star size={32} color="#000000" filled={rating >= star} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>{t('product.comment')}</Text>
            <TextInput
              style={styles.textArea}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience with this piece..."
              placeholderTextColor="#737373"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formActions}>
            <Button
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting || !comment.trim()}
            >
              {t('product.submitReview') || 'Submit Review'}
            </Button>
            <Button
              onPress={() => {
                setIsWriting(false);
                setComment('');
                setRating(5);
              }}
              variant="outline"
              size="md"
            >
              Cancel
            </Button>
          </View>
        </View>
      )}

      <View style={styles.reviewsList}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Loader2 size={24} color="#737373" />
            <Text style={styles.loadingText}>Loading reviews...</Text>
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageSquare size={48} color="#D4D4D4" />
            <Text style={styles.emptyText}>No reviews yet. Be the first to review this product!</Text>
          </View>
        ) : (
          reviews.map((review, idx) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUserInfo}>
                  <View style={styles.userAvatar}>
                    <User size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.reviewUserDetails}>
                    <Text style={styles.reviewUserName}>{review.user_name}</Text>
                    {review.is_verified_purchase && (
                      <View style={styles.verifiedBadge}>
                        <CheckCircle2 size={12} color="#10B981" />
                        <Text style={styles.verifiedText}>Verified Purchase</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.reviewContent}>
                <View style={styles.reviewStars}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} color="#000000" filled={i < review.rating} />
                  ))}
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
              {idx < reviews.length - 1 && <View style={styles.reviewDivider} />}
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 48,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerContent: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 8,
    color: '#737373',
    marginBottom: 16,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -2,
    color: '#000000',
  },
  starsContainer: {
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewCount: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  formContainer: {
    backgroundColor: '#FAFAFA',
    padding: 40,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    marginBottom: 48,
  },
  formSection: {
    marginBottom: 32,
  },
  formLabel: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  starsInputRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
  },
  starButton: {
    padding: 4,
  },
  textArea: {
    width: '100%',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 40,
    fontSize: 14,
    fontWeight: '400',
    minHeight: 150,
    color: '#000000',
  },
  formActions: {
    gap: 16,
    marginTop: 32,
  },
  reviewsList: {
    gap: 48,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  loadingText: {
    fontSize: 12,
    color: '#737373',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
    textAlign: 'center',
    maxWidth: 400,
  },
  reviewItem: {
    paddingBottom: 48,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewUserDetails: {
    flex: 1,
    gap: 4,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: '#10B981',
  },
  reviewDate: {
    fontSize: 10,
    fontWeight: '400',
    color: '#737373',
  },
  reviewContent: {
    gap: 16,
    paddingLeft: 60,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewComment: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: '#404040',
    maxWidth: 672,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginTop: 48,
  },
});

export default ProductReviews;

