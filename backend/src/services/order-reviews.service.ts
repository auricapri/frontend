import { OrderReviewsRepository } from '../repositories/order-reviews.repository.js';
import { OrdersRepository } from '../repositories/orders.repository.js';
import { OrderReview, CreateOrderReviewInput, UpdateOrderReviewInput } from '../types/order-review.types.js';
import { supabase } from '../config/supabase.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { StoreRepository } from '../repositories/store.repository.js';
import logger from '../config/logger.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export class OrderReviewsService {
  private reviewsRepo: OrderReviewsRepository;
  private ordersRepo: OrdersRepository;
  private usersRepo: UsersRepository;
  private storeRepo: StoreRepository;

  constructor() {
    this.reviewsRepo = new OrderReviewsRepository();
    this.ordersRepo = new OrdersRepository();
    this.usersRepo = new UsersRepository();
    this.storeRepo = new StoreRepository();
  }

  async getByOrderId(orderId: string, userId?: string): Promise<OrderReview[]> {
    const reviews = await this.reviewsRepo.getByOrderId(orderId);

    if (userId) {
      for (const review of reviews) {
        review.user_has_helped = await this.reviewsRepo.getUserHasHelped(review.id, userId);
      }
    }

    return reviews;
  }

  async getByUserId(userId: string): Promise<OrderReview[]> {
    return this.reviewsRepo.getByUserId(userId);
  }

  async create(userId: string, input: CreateOrderReviewInput): Promise<OrderReview> {
    const order = await this.ordersRepo.getById(input.order_id);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.user_id !== userId) {
      throw new Error('You can only review your own orders');
    }

    const orderStatus = order.status?.toLowerCase();
    const isDelivered = orderStatus === 'delivered' || orderStatus === 'entregue';
    if (!isDelivered) {
      throw new Error('You can only review delivered orders');
    }

    const existingReview = await this.reviewsRepo.getByOrderIdAndUserId(input.order_id, userId);
    if (existingReview) {
      throw new Error('You have already reviewed this order');
    }

    const review = await this.reviewsRepo.create({
      order_id: input.order_id,
      user_id: userId,
      rating: input.rating,
      comment: input.comment || null
    });

    if (input.media && input.media.length > 0) {
      await this.uploadMedia(review.id, input.media);
    }

    await this.processReviewCashback(userId, review.id);
    
    const updatedReview = await this.reviewsRepo.getById(review.id);
    if (!updatedReview) {
      throw new Error('Failed to retrieve created review');
    }
    return updatedReview;
  }

  async update(userId: string, reviewId: string, input: UpdateOrderReviewInput): Promise<OrderReview> {
    const currentReview = await this.reviewsRepo.getById(reviewId);
    
    if (!currentReview) {
      throw new Error('Review not found');
    }

    if (currentReview.user_id !== userId) {
      throw new Error('You can only edit your own reviews');
    }

    const updates: any = {};
    if (input.rating !== undefined) updates.rating = input.rating;
    if (input.comment !== undefined) updates.comment = input.comment;

    if (Object.keys(updates).length > 0) {
      await this.reviewsRepo.update(reviewId, updates);
    }

    if (input.remove_media_ids && input.remove_media_ids.length > 0) {
      for (const mediaId of input.remove_media_ids) {
        await this.reviewsRepo.removeMedia(mediaId);
      }
    }

    if (input.media && input.media.length > 0) {
      await this.uploadMedia(reviewId, input.media);
    }

    const updatedReview = await this.reviewsRepo.getById(reviewId);
    if (!updatedReview) {
      throw new Error('Failed to retrieve updated review');
    }
    return updatedReview;
  }

  async toggleHelpful(reviewId: string, userId: string): Promise<{ helpful_count: number; user_has_helped: boolean }> {
    return this.reviewsRepo.toggleHelpful(reviewId, userId);
  }

  private async uploadMedia(reviewId: string, files: File[]): Promise<void> {
    let totalSize = 0;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      totalSize += file.size;
      if (totalSize > MAX_TOTAL_SIZE) {
        throw new Error(`Total file size exceeds maximum of ${MAX_TOTAL_SIZE / 1024 / 1024}MB`);
      }

      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        throw new Error(`File type ${file.type} is not allowed`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${reviewId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `order-reviews/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('order-reviews')
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('order-reviews')
        .getPublicUrl(filePath);

      await this.reviewsRepo.addMedia(reviewId, {
        media_url: publicUrl,
        media_type: isImage ? 'image' : 'video',
        file_size: file.size,
        file_name: file.name
      });
    }
  }

  private async processReviewCashback(userId: string, reviewId: string): Promise<void> {
    try {
      const { data: reviewData } = await supabase
        .from('order_reviews')
        .select('cashback_awarded')
        .eq('id', reviewId)
        .single();

      if (!reviewData || reviewData.cashback_awarded) {
        return;
      }

      const user = await this.usersRepo.getProfile(userId);
      const storeConfig = await this.storeRepo.getConfig();

      if (!user || !storeConfig?.loyalty_program?.enabled) {
        return;
      }

      const config = storeConfig.loyalty_program;
      const reviewCashback = config.review_cashback_amount || 0;

      if (reviewCashback > 0) {
        const userLoyalty = user.loyalty || { current_xp: 0, current_level: 1, cashback_balance: 0 };
        const currentCashback = userLoyalty.cashback_balance || 0;
        const newCashback = currentCashback + reviewCashback;

        const updatedLoyalty = {
          current_xp: userLoyalty.current_xp || 0,
          current_level: userLoyalty.current_level || 1,
          cashback_balance: newCashback,
          last_seen_level: userLoyalty.last_seen_level,
          pending_reward_coupon: userLoyalty.pending_reward_coupon
        };

        await this.usersRepo.updateProfile(userId, {
          loyalty: updatedLoyalty
        });

        await supabase
          .from('order_reviews')
          .update({ cashback_awarded: true })
          .eq('id', reviewId);
      }
    } catch (error) {
      logger.error('Error processing review cashback', { error: error instanceof Error ? error.message : String(error), reviewId });
    }
  }
}

