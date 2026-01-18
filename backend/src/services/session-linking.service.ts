import { getTrackingRepository } from '../repositories/tracking.repository.js';
import { getUserProfileService } from './user-profile.service.js';
import logger from '../config/logger.js';
import { supabase } from '../config/supabase.js';

export class SessionLinkingService {
  private trackingRepo = getTrackingRepository();
  private userProfileService = getUserProfileService();

  async linkSessionToUser(sessionId: string, userId: string): Promise<void> {
    try {
      logger.info('Linking session to user', { sessionId, userId });

      // 1. Update all tracking events with this sessionId that don't have a user_id
      const { data, error, count } = await supabase
        .from('tracking_events')
        .update({ user_id: userId })
        .eq('session_id', sessionId)
        .is('user_id', null)
        .select('id');

      if (error) throw error;

      const linkedCount = count || (data ? data.length : 0);
      logger.info('Session events linked to user', { sessionId, userId, linkedCount });

      // 2. Trigger tag recalculation for the user now that they have more history
      if (linkedCount > 0) {
        await this.userProfileService.calculateUserTags(userId);
      }
    } catch (error) {
      logger.error('Error linking session to user', { sessionId, userId, error });
    }
  }
}

let singleton: SessionLinkingService | null = null;
export function getSessionLinkingService(): SessionLinkingService {
  if (!singleton) singleton = new SessionLinkingService();
  return singleton;
}
