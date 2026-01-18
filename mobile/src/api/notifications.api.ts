import { apiClient } from './client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'info' | 'error' | 'order' | 'promotion';
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export class NotificationsApi {
  async getAll(): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/notifications');
  }

  async markAsRead(id: string): Promise<void> {
    return apiClient.put<void>(`/notifications/${id}/read`, {});
  }

  async markAllAsRead(): Promise<void> {
    return apiClient.put<void>('/notifications/read-all', {});
  }
}

