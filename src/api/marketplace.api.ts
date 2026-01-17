import { apiClient } from './client';
import type {
  MarketplaceProvider,
  MarketplaceConfig,
  MarketplaceConfigInput,
  MarketplaceConfigUpdate,
  MarketplaceProductMapping,
  MappingInput,
  MarketplaceSyncLog,
  SyncResult,
  SyncStats,
  LogStats,
  SyncStatus,
  SyncAction,
  SyncLogStatus,
} from '../types/marketplace';

const BASE_PATH = '/marketplace';

/**
 * Marketplace API client for admin operations.
 */
export class MarketplaceApi {
  // ============================================
  // PROVIDERS
  // ============================================

  /**
   * Get all active marketplace providers.
   */
  async getProviders(): Promise<MarketplaceProvider[]> {
    return apiClient.get<MarketplaceProvider[]>(`${BASE_PATH}/providers`);
  }

  /**
   * Get a provider by ID.
   */
  async getProvider(id: string): Promise<MarketplaceProvider> {
    return apiClient.get<MarketplaceProvider>(`${BASE_PATH}/providers/${id}`);
  }

  // ============================================
  // CONFIGS
  // ============================================

  /**
   * Get all marketplace configurations.
   */
  async getConfigs(): Promise<MarketplaceConfig[]> {
    return apiClient.get<MarketplaceConfig[]>(`${BASE_PATH}/configs`);
  }

  /**
   * Get a config by ID.
   */
  async getConfig(id: string): Promise<MarketplaceConfig> {
    return apiClient.get<MarketplaceConfig>(`${BASE_PATH}/configs/${id}`);
  }

  /**
   * Create a new marketplace configuration.
   */
  async createConfig(input: MarketplaceConfigInput): Promise<MarketplaceConfig> {
    return apiClient.post<MarketplaceConfig>(`${BASE_PATH}/configs`, input);
  }

  /**
   * Update a marketplace configuration.
   */
  async updateConfig(id: string, input: MarketplaceConfigUpdate): Promise<MarketplaceConfig> {
    return apiClient.put<MarketplaceConfig>(`${BASE_PATH}/configs/${id}`, input);
  }

  /**
   * Delete a marketplace configuration.
   */
  async deleteConfig(id: string): Promise<void> {
    return apiClient.delete(`${BASE_PATH}/configs/${id}`);
  }

  // ============================================
  // OAUTH
  // ============================================

  /**
   * Get OAuth authorization URL for a config.
   */
  async getAuthUrl(configId: string, redirectUri: string): Promise<{ url: string }> {
    return apiClient.get<{ url: string }>(
      `${BASE_PATH}/configs/${configId}/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`
    );
  }

  /**
   * Process OAuth callback.
   */
  async handleOAuthCallback(
    configId: string,
    code: string,
    redirectUri: string
  ): Promise<{ status: string; message: string }> {
    return apiClient.post<{ status: string; message: string }>(
      `${BASE_PATH}/configs/${configId}/callback`,
      { code, redirect_uri: redirectUri }
    );
  }

  /**
   * Test connection for a config.
   */
  async testConnection(configId: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.post<{ success: boolean; message?: string }>(
      `${BASE_PATH}/configs/${configId}/test`
    );
  }

  // ============================================
  // MAPPINGS
  // ============================================

  /**
   * Get product mappings with optional filters.
   */
  async getMappings(params?: {
    product_id?: string;
    config_id?: string;
    sync_status?: SyncStatus;
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceProductMapping[]> {
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
  async getMapping(id: string): Promise<MarketplaceProductMapping> {
    return apiClient.get<MarketplaceProductMapping>(`${BASE_PATH}/mappings/${id}`);
  }

  /**
   * Create a new product mapping.
   */
  async createMapping(input: MappingInput): Promise<MarketplaceProductMapping> {
    return apiClient.post<MarketplaceProductMapping>(`${BASE_PATH}/mappings`, input);
  }

  /**
   * Update a mapping.
   */
  async updateMapping(
    id: string,
    input: Partial<MarketplaceProductMapping>
  ): Promise<MarketplaceProductMapping> {
    return apiClient.put<MarketplaceProductMapping>(`${BASE_PATH}/mappings/${id}`, input);
  }

  /**
   * Delete a mapping.
   */
  async deleteMapping(id: string): Promise<void> {
    return apiClient.delete(`${BASE_PATH}/mappings/${id}`);
  }

  /**
   * Force sync a specific mapping.
   */
  async syncMapping(mappingId: string): Promise<{ results: SyncResult[] }> {
    return apiClient.post<{ results: SyncResult[] }>(`${BASE_PATH}/mappings/${mappingId}/sync`);
  }

  // ============================================
  // SYNC OPERATIONS
  // ============================================

  /**
   * Sync multiple products to all marketplaces.
   */
  async syncProducts(
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
  async syncPending(configId?: string): Promise<{ results: SyncResult[] }> {
    return apiClient.post<{ results: SyncResult[] }>(`${BASE_PATH}/sync/pending`, {
      config_id: configId,
    });
  }

  /**
   * Get sync statistics.
   */
  async getSyncStats(configId?: string): Promise<SyncStats> {
    const query = configId ? `?config_id=${configId}` : '';
    return apiClient.get<SyncStats>(`${BASE_PATH}/sync/stats${query}`);
  }

  /**
   * Calculate marketplace price for a product.
   */
  async calculatePrice(
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

  // ============================================
  // LOGS
  // ============================================

  /**
   * Get sync logs with optional filters.
   */
  async getLogs(params?: {
    config_id?: string;
    mapping_id?: string;
    action?: SyncAction;
    status?: SyncLogStatus;
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceSyncLog[]> {
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
  async getLogStats(configId: string, since?: Date): Promise<LogStats> {
    const params = new URLSearchParams({ config_id: configId });
    if (since) params.set('since', since.toISOString());
    return apiClient.get<LogStats>(`${BASE_PATH}/logs/stats?${params.toString()}`);
  }
}

// Singleton instance
export const marketplaceApi = new MarketplaceApi();
