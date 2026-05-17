import { apiClient } from './client';
import type { LocalizedText } from '../types';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: LocalizedText | string;
  content: LocalizedText | string;
  is_read: boolean;
  link_url: string | null;
  created_at: string;
}

export class NotificationsApi {
  async getAll(unreadOnly: boolean = false): Promise<Notification[]> {
    return apiClient.get<Notification[]>(`/notifications?unreadOnly=${unreadOnly}`);
  }

  async markAsRead(id: string): Promise<Notification> {
    return apiClient.put<Notification>(`/notifications/${id}/read`, {});
  }

  async markAllAsRead(): Promise<void> {
    return apiClient.put<void>('/notifications/read-all', {});
  }
}

