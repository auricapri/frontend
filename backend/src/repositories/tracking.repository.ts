import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';

export interface TrackingEventInsert {
  event_type: string;
  user_id: string | null;
  session_id: string;
  ip_address: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referer: string | null;
  device_type: string | null;
  is_bot: boolean;
  metadata: Record<string, unknown> | null;
  created_at?: string;
}

export interface TrackingEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  session_id: string;
  ip_address: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referer: string | null;
  device_type: string | null;
  is_bot: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export class TrackingRepository {
  async insertEvent(event: TrackingEventInsert): Promise<void> {
    if (event.is_bot) return;

    const { error } = await supabase.from('tracking_events').insert(event);
    if (error) {
      logger.warn('Failed to insert tracking event', { error });
    }
  }

  async bulkInsertEvents(events: TrackingEventInsert[]): Promise<void> {
    if (events.length === 0) return;

    const filtered = events.filter(e => !e.is_bot);
    if (filtered.length === 0) return;

    const getPath = (e: TrackingEventInsert): string | null => {
      const meta = e.metadata;
      if (!meta || typeof meta !== 'object') return null;
      const path = (meta as Record<string, unknown>).path;
      return typeof path === 'string' && path.length > 0 ? path : null;
    };

    const pageViews = filtered.filter(e => e.event_type === 'page_view' && getPath(e));
    const others = filtered.filter(e => e.event_type !== 'page_view' || !getPath(e));

    const uniquePageViews: TrackingEventInsert[] = [];
    if (pageViews.length > 0) {
      const seen = new Set<string>();

      for (const event of pageViews) {
        const path = getPath(event);
        if (!path) continue;
        const key = `${event.session_id}:${path}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniquePageViews.push(event);
        }
      }
    }

    const allEvents = [...uniquePageViews, ...others];
    if (allEvents.length > 0) {
      const { error } = await supabase.from('tracking_events').insert(allEvents);
      if (error) {
        logger.warn('Failed to bulk insert tracking events', { error, count: allEvents.length });
      }
    }
  }

  async getEventsByUser(userId: string, limit: number = 100): Promise<TrackingEvent[]> {
    const { data, error } = await supabase
      .from('tracking_events')
      .select('id, event_type, user_id, session_id, ip_address, ip_hash, user_agent, referer, device_type, is_bot, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as TrackingEvent[];
  }

  async refreshAggregates(): Promise<void> {
    const { error } = await supabase.rpc('refresh_tracking_aggregates');
    if (error) {
      logger.warn('Failed to refresh tracking aggregates', { error });
      throw error;
    }
  }

  async createPartitions(): Promise<void> {
    const { error } = await supabase.rpc('create_tracking_events_partitions');
    if (error) {
      logger.warn('Failed to create tracking partitions', { error });
      throw error;
    }
  }

  async cleanupOldEvents(): Promise<number> {
    const { error } = await supabase.rpc('cleanup_old_tracking_events');
    if (error) {
      logger.warn('Failed to cleanup old tracking events', { error });
      throw error;
    }
    return 0;
  }
}

let singleton: TrackingRepository | null = null;
export function getTrackingRepository(): TrackingRepository {
  if (!singleton) singleton = new TrackingRepository();
  return singleton;
}
