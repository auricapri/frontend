/**
 * Marketplace Products API - Mappings and Sync Operations
 */
import { apiClient } from '../client';
import type {
  MarketplaceProductMapping,
  MappingInput,
  SyncResult,
  SyncStats,
  SyncStatus,
} from './types';

const BASE_PATH = '/marketplace';

// ============================================
// MAPPINGS
// ============================================

export interface GetMappingsParams {
  product_id?: string;
  config_id?: string;
  sync_status?: SyncStatus;
  limit?: number;
  offset?: number;
}

/**
 * Get product mappings with optional filters.
 */
export async function getMappings(params?: GetMappingsParams): Promise<MarketplaceProductMapping[]> {
  const searchParams = new URLSearchParams();
  if (params?.product_id) searchParams.set('product_id', params.product_id);
  if (params?.config_id) searchParams.set('config_id', params.config_id);
  if (params?.sync_status) searchParams.set('sync_status', params.sync_status);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const query = searchParams.toString();
  return apiClient.get<MarketplaceProductMapping[]>(
    `${BASE_PATH}/mappings${query ? `?${query}` : ''}`
  );
}

/**
 * Get a mapping by ID.
 */
export async function getMapping(id: string): Promise<MarketplaceProductMapping> {
  return apiClient.get<MarketplaceProductMapping>(`${BASE_PATH}/mappings/${id}`);
}

/**
 * Create a new product mapping.
 */
export async function createMapping(input: MappingInput): Promise<MarketplaceProductMapping> {
  return apiClient.post<MarketplaceProductMapping>(`${BASE_PATH}/mappings`, input);
}

/**
 * Update a mapping.
 */
export async function updateMapping(
  id: string,
  input: Partial<MarketplaceProductMapping>
): Promise<MarketplaceProductMapping> {
  return apiClient.put<MarketplaceProductMapping>(`${BASE_PATH}/mappings/${id}`, input);
}

/**
 * Delete a mapping.
 */
export async function deleteMapping(id: string): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/mappings/${id}`);
}

/**
 * Force sync a specific mapping.
 */
export async function syncMapping(mappingId: string): Promise<{ results: SyncResult[] }> {
  return apiClient.post<{ results: SyncResult[] }>(`${BASE_PATH}/mappings/${mappingId}/sync`);
}

// ============================================
// SYNC OPERATIONS
// ============================================

/**
 * Sync multiple products to all marketplaces.
 */
export async function syncProducts(
  productIds: string[]
): Promise<{ results: Array<{ product_id: string; results: SyncResult[] }> }> {
  return apiClient.post<{ results: Array<{ product_id: string; results: SyncResult[] }> }>(
    `${BASE_PATH}/sync/products`,
    { product_ids: productIds }
  );
}

/**
 * Sync all pending products.
 */
export async function syncPending(configId?: string): Promise<{ results: SyncResult[] }> {
  return apiClient.post<{ results: SyncResult[] }>(`${BASE_PATH}/sync/pending`, {
    config_id: configId,
  });
}

/**
 * Get sync statistics.
 */
export async function getSyncStats(configId?: string): Promise<SyncStats> {
  const query = configId ? `?config_id=${configId}` : '';
  return apiClient.get<SyncStats>(`${BASE_PATH}/sync/stats${query}`);
}

/**
 * Calculate marketplace price for a product.
 */
export async function calculatePrice(
  productId: string,
  configId: string,
  variantId?: string
): Promise<{ price: number }> {
  return apiClient.post<{ price: number }>(`${BASE_PATH}/calculate-price`, {
    product_id: productId,
    config_id: configId,
    variant_id: variantId,
  });
}
