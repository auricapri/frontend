/**
 * Marketplace Orders API - Orders, Questions, and Logs
 */
import { apiClient } from '../client';
import type {
  MarketplaceOrder,
  MarketplaceQuestion,
  MarketplaceSyncLog,
  LogStats,
  SyncAction,
  SyncLogStatus,
} from './types';

const BASE_PATH = '/marketplace';

// ============================================
// ORDERS
// ============================================

export interface GetOrdersParams {
  status?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Get orders from marketplace.
 */
export async function getOrders(
  configId: string,
  params?: GetOrdersParams
): Promise<{ orders: MarketplaceOrder[] }> {
  const searchParams = new URLSearchParams({ config_id: configId });
  if (params?.status) searchParams.set('status', params.status);
  if (params?.since) searchParams.set('since', params.since.toISOString());
  if (params?.until) searchParams.set('until', params.until.toISOString());
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  return apiClient.get<{ orders: MarketplaceOrder[] }>(`${BASE_PATH}/orders?${searchParams.toString()}`);
}

/**
 * Get a specific order.
 */
export async function getOrder(configId: string, orderId: string): Promise<MarketplaceOrder> {
  return apiClient.get<MarketplaceOrder>(`${BASE_PATH}/orders/${orderId}?config_id=${configId}`);
}

/**
 * Sync orders from marketplace.
 */
export async function syncOrders(
  configId: string,
  since?: Date
): Promise<{ synced: number; orders: MarketplaceOrder[] }> {
  return apiClient.post<{ synced: number; orders: MarketplaceOrder[] }>(`${BASE_PATH}/orders/sync`, {
    config_id: configId,
    since: since?.toISOString(),
  });
}

// ============================================
// QUESTIONS
// ============================================

export interface GetQuestionsParams {
  status?: 'UNANSWERED' | 'ANSWERED';
  item_id?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get questions from marketplace.
 */
export async function getQuestions(
  configId: string,
  params?: GetQuestionsParams
): Promise<{ questions: MarketplaceQuestion[] }> {
  const searchParams = new URLSearchParams({ config_id: configId });
  if (params?.status) searchParams.set('status', params.status);
  if (params?.item_id) searchParams.set('item_id', params.item_id);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  return apiClient.get<{ questions: MarketplaceQuestion[] }>(
    `${BASE_PATH}/questions?${searchParams.toString()}`
  );
}

/**
 * Answer a question.
 */
export async function answerQuestion(
  configId: string,
  questionId: string,
  answer: string
): Promise<{ status: string; message: string }> {
  return apiClient.post<{ status: string; message: string }>(
    `${BASE_PATH}/questions/${questionId}/answer`,
    { config_id: configId, answer }
  );
}

// ============================================
// LOGS
// ============================================

export interface GetLogsParams {
  config_id?: string;
  mapping_id?: string;
  action?: SyncAction;
  status?: SyncLogStatus;
  limit?: number;
  offset?: number;
}

/**
 * Get sync logs with optional filters.
 */
export async function getLogs(params?: GetLogsParams): Promise<MarketplaceSyncLog[]> {
  const searchParams = new URLSearchParams();
  if (params?.config_id) searchParams.set('config_id', params.config_id);
  if (params?.mapping_id) searchParams.set('mapping_id', params.mapping_id);
  if (params?.action) searchParams.set('action', params.action);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const query = searchParams.toString();
  return apiClient.get<MarketplaceSyncLog[]>(`${BASE_PATH}/logs${query ? `?${query}` : ''}`);
}

/**
 * Get log statistics for a config.
 */
export async function getLogStats(configId: string, since?: Date): Promise<LogStats> {
  const params = new URLSearchParams({ config_id: configId });
  if (since) params.set('since', since.toISOString());
  return apiClient.get<LogStats>(`${BASE_PATH}/logs/stats?${params.toString()}`);
}
