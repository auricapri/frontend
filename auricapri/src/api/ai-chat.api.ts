/**
 * AI Chat API Service
 * Comunicação com o chatbot de IA para vendas
 */

import { aiChatClient } from './client';

// Interfaces
export interface ChatRequest {
  user_id: string;
  message: string;
  session_id?: string;
}

export interface ChatProductVariant {
  sku: string;
  size: string;
  color: string;
  color_hex: string;
  retail_price: number;
  wholesale_price: number;
  stock: number;
  images: string[];
}

export interface ChatProduct {
  id: string;
  name: string;
  description: string;
  category_id: string;
  available: boolean;
  images: string[];
  highlight: boolean;
  variants: ChatProductVariant[];
  price_from: number;
}

export interface ChatResponse {
  status: 'success' | 'queued' | 'error';
  message?: string;
  products?: ChatProduct[];
  position?: number;
  estimated_wait?: number;
  error?: string;
}

export interface QueueStatus {
  user_id: string;
  position: number;
  total_in_queue: number;
  estimated_wait: number;
}

export interface HealthStatus {
  status: string;
  gpu_usage: number;
  active_requests: number;
  queue_size: number;
  model: string;
}

export class AiChatApi {
  /**
   * Envia uma mensagem para o chat IA
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return aiChatClient.post<ChatResponse>('/chat', request);
  }

  /**
   * Verifica a posição na fila de processamento
   */
  async getQueueStatus(userId: string): Promise<QueueStatus> {
    return aiChatClient.get<QueueStatus>(`/queue/${encodeURIComponent(userId)}`);
  }

  /**
   * Limpa o histórico da sessão do chat
   */
  async clearSession(userId: string): Promise<{ status: string; message: string }> {
    return aiChatClient.delete(`/session/${encodeURIComponent(userId)}`);
  }

  /**
   * Verifica o status de saúde da API de IA
   */
  async getHealth(): Promise<HealthStatus> {
    return aiChatClient.get<HealthStatus>('/health');
  }
}

export const aiChatApi = new AiChatApi();
