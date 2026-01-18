import { supabase } from '../config/supabase.js';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: any; // JSONB
  content: any; // JSONB
  is_read: boolean;
  link_url: string | null;
  created_at: string;
}

export class NotificationsRepository {
  async create(data: {
    user_id: string;
    type: string;
    title: any;
    content: any;
    link_url?: string | null;
  }): Promise<Notification> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return notification as Notification;
  }

  async getByUserId(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Notification[];
  }

  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }
}

