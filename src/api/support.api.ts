import { apiClient } from './client';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: string;
  source: string;
  attachments: Array<{ name: string; url: string; size: number; type: string }>;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  category: string;
  order_id?: string;
}

export class SupportApi {
  async createTicket(data: CreateTicketData, files?: File[]): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('description', data.description);
    formData.append('category', data.category);
    if (data.order_id) {
      formData.append('order_id', data.order_id);
    }
    if (files) {
      for (const file of files) {
        formData.append('attachments', file);
      }
    }
    return apiClient.post<{ id: string }>('/support/tickets', formData);
  }

  async getTickets(): Promise<SupportTicket[]> {
    return apiClient.get<SupportTicket[]>('/support/tickets');
  }
}
