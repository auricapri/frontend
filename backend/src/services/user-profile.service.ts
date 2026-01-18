import { getCampaignsRepository, UserTag } from '../repositories/campaigns.repository.js';
import { getTrackingRepository } from '../repositories/tracking.repository.js';
import { getOrdersRepository } from '../repositories/orders.repository.js';
import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';
import type { Order } from '../../shared/types/index.js';

export class UserProfileService {
  private campaignsRepo = getCampaignsRepository();
  private trackingRepo = getTrackingRepository();
  private ordersRepo = getOrdersRepository();

  async calculateUserTags(userId: string): Promise<void> {
    try {
      const tags: UserTag[] = [];

      // 1. Tags based on purchases
      const purchaseTags = await this.getPurchaseBasedTags(userId);
      tags.push(...purchaseTags);

      // 2. Tags based on tracking (behavior)
      const trackingTags = await this.getTrackingBasedTags(userId);
      tags.push(...trackingTags);

      // Upsert all tags
      for (const tag of tags) {
        await this.campaignsRepo.upsertUserTag(tag);
      }

      logger.info('User tags updated', { userId, tagCount: tags.length });
    } catch (error) {
      logger.error('Error calculating user tags', { userId, error });
    }
  }

  private async getPurchaseBasedTags(userId: string): Promise<UserTag[]> {
    const tags: UserTag[] = [];
    try {
      const orders = await this.ordersRepo.getByUserId(userId);
      if (!orders || orders.length === 0) return [];

      // Frequent buyer
      if (orders.length >= 5) {
        tags.push({
          user_id: userId,
          tag: 'frequent_buyer',
          score: Math.min(1, orders.length / 10),
          source: 'purchase'
        });
      }

      // Premium buyer (Average ticket > 500)
      const totalSpent = orders.reduce((sum: number, order: Order) => sum + Number(order.total || 0), 0);
      const avgTicket = totalSpent / orders.length;
      if (avgTicket > 500) {
        tags.push({
          user_id: userId,
          tag: 'premium_buyer',
          score: Math.min(1, avgTicket / 1000),
          source: 'purchase'
        });
      }

      // Category based tags could be added here by analyzing order items
    } catch (error) {
      logger.error('Error getting purchase based tags', { userId, error });
    }
    return tags;
  }

  private async getTrackingBasedTags(userId: string): Promise<UserTag[]> {
    const tags: UserTag[] = [];
    try {
      const events = await this.trackingRepo.getEventsByUser(userId, 100);
      if (!events || events.length === 0) return [];

      const pageViews = events.filter((e: any) => e.event_type === 'page_view').length;
      if (pageViews > 20) {
        tags.push({
          user_id: userId,
          tag: 'high_engagement',
          score: Math.min(1, pageViews / 50),
          source: 'tracking'
        });
      }

      const cartAbandons = events.filter((e: any) => e.event_type === 'checkout_start').length - 
                           events.filter((e: any) => e.event_type === 'purchase').length;
      if (cartAbandons > 0) {
        tags.push({
          user_id: userId,
          tag: 'cart_abandoner',
          score: Math.min(1, cartAbandons / 5),
          source: 'tracking'
        });
      }
    } catch (error) {
      logger.error('Error getting tracking based tags', { userId, error });
    }
    return tags;
  }

  async applyTagDecay(): Promise<void> {
    try {
      // This calls the database function we created in the migration
      const { error } = await supabase.rpc('apply_tag_decay');
      if (error) throw error;
      logger.info('Tag decay applied successfully');
    } catch (error) {
      logger.error('Error applying tag decay', { error });
    }
  }
}

let singleton: UserProfileService | null = null;
export function getUserProfileService(): UserProfileService {
  if (!singleton) singleton = new UserProfileService();
  return singleton;
}
