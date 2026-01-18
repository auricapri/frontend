import { ProductReviewsRepository } from '../repositories/product-reviews.repository.js';
import { OrdersRepository } from '../repositories/orders.repository.js';
import { ProductReview, CreateProductReviewInput, UpdateProductReviewInput, OrderItemForReview } from '../types/product-review.types.js';
import { supabase } from '../config/supabase.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { StoreRepository } from '../repositories/store.repository.js';
import logger from '../config/logger.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export class ProductReviewsService {
  private reviewsRepo: ProductReviewsRepository;
  private ordersRepo: OrdersRepository;
  private usersRepo: UsersRepository;
  private storeRepo: StoreRepository;

  constructor() {
    this.reviewsRepo = new ProductReviewsRepository();
    this.ordersRepo = new OrdersRepository();
    this.usersRepo = new UsersRepository();
    this.storeRepo = new StoreRepository();
  }

  async getOrderItemsForReview(orderId: string, userId: string): Promise<OrderItemForReview[]> {
    const order = await this.ordersRepo.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const orderStatus = order.status?.toLowerCase();
    const isDelivered = orderStatus === 'delivered' || orderStatus === 'entregue';
    if (!isDelivered) {
      throw new Error('Order is not delivered yet');
    }

    if (order.user_id !== userId) {
      throw new Error('You can only review your own orders');
    }

    const reviews = await this.reviewsRepo.getByOrderId(orderId);
    const reviewsMap = new Map<string, ProductReview>();
    reviews.forEach(r => {
      const key = `${r.order_item_id}-${r.variant_id || ''}`;
      reviewsMap.set(key, r);
    });

    const items: OrderItemForReview[] = (order.items || []).map((item: any, index: number) => {
      const orderItemId = item.id || item.variant_id || `item-${index}`;
      const key = `${orderItemId}-${item.variant_id || ''}`;
      const review = reviewsMap.get(key);

      return {
        order_item_id: orderItemId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.name,
        variant_size: item.size || '',
        variant_color: item.color_name || '',
        image: item.image || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        has_review: !!review,
        review: review || undefined
      };
    });

    return items;
  }

  async getByProductId(productId: string, userId?: string): Promise<ProductReview[]> {
    const reviews = await this.reviewsRepo.getByProductId(productId);

    if (userId) {
      for (const review of reviews) {
        review.user_has_helped = await this.reviewsRepo.getUserHasHelped(review.id, userId);
      }
    }

    return reviews;
  }

  async create(userId: string, input: CreateProductReviewInput): Promise<ProductReview> {
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

    const existingReview = await this.reviewsRepo.getByOrderItemId(input.order_id, input.order_item_id, userId);
    if (existingReview) {
      throw new Error('You have already reviewed this product variant');
    }

    const review = await this.reviewsRepo.create({
      order_id: input.order_id,
      order_item_id: input.order_item_id,
      product_id: input.product_id,
      variant_id: input.variant_id,
      user_id: userId,
      rating: input.rating,
      comment: input.comment || null,
      variant_size: input.variant_size,
      variant_color: typeof input.variant_color === 'string' ? input.variant_color : JSON.stringify(input.variant_color)
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

  async update(userId: string, reviewId: string, input: UpdateProductReviewInput): Promise<ProductReview> {
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

      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('product-reviews')
        .upload(fileName, arrayBuffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-reviews')
        .getPublicUrl(fileName);

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
        .from('product_reviews')
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
          .from('product_reviews')
          .update({ cashback_awarded: true })
          .eq('id', reviewId);
      }
    } catch (error) {
      logger.error('Error processing review cashback', { error });
    }
  }
}

