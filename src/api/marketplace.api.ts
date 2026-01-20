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
   * @param configId - The config ID
   * @param redirectUri - The redirect URI for OAuth callback
   * @param codeChallenge - PKCE code_challenge (SHA256 hash of code_verifier, base64url encoded)
   * @param codeVerifier - PKCE code_verifier (will be stored in state for token exchange)
   */
  async getAuthUrl(
    configId: string,
    redirectUri: string,
    codeChallenge?: string,
    codeVerifier?: string
  ): Promise<{ url: string }> {
    const params = new URLSearchParams({ redirect_uri: redirectUri });
    if (codeChallenge) params.set('code_challenge', codeChallenge);
    if (codeVerifier) params.set('code_verifier', codeVerifier);

    return apiClient.get<{ url: string }>(
      `${BASE_PATH}/configs/${configId}/auth-url?${params.toString()}`
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

  // ============================================
  // ORDERS
  // ============================================

  /**
   * Get orders from marketplace.
   */
  async getOrders(configId: string, params?: {
    status?: string;
    since?: Date;
    until?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: MarketplaceOrder[] }> {
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
  async getOrder(configId: string, orderId: string): Promise<MarketplaceOrder> {
    return apiClient.get<MarketplaceOrder>(`${BASE_PATH}/orders/${orderId}?config_id=${configId}`);
  }

  /**
   * Sync orders from marketplace.
   */
  async syncOrders(configId: string, since?: Date): Promise<{ synced: number; orders: MarketplaceOrder[] }> {
    return apiClient.post<{ synced: number; orders: MarketplaceOrder[] }>(`${BASE_PATH}/orders/sync`, {
      config_id: configId,
      since: since?.toISOString(),
    });
  }

  // ============================================
  // QUESTIONS
  // ============================================

  /**
   * Get questions from marketplace.
   */
  async getQuestions(configId: string, params?: {
    status?: 'UNANSWERED' | 'ANSWERED';
    item_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ questions: MarketplaceQuestion[] }> {
    const searchParams = new URLSearchParams({ config_id: configId });
    if (params?.status) searchParams.set('status', params.status);
    if (params?.item_id) searchParams.set('item_id', params.item_id);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return apiClient.get<{ questions: MarketplaceQuestion[] }>(`${BASE_PATH}/questions?${searchParams.toString()}`);
  }

  /**
   * Answer a question.
   */
  async answerQuestion(configId: string, questionId: string, answer: string): Promise<{ status: string; message: string }> {
    return apiClient.post<{ status: string; message: string }>(`${BASE_PATH}/questions/${questionId}/answer`, {
      config_id: configId,
      answer,
    });
  }

  // ============================================
  // SHIPPING
  // ============================================

  /**
   * Get shipment details.
   */
  async getShipment(configId: string, shipmentId: string): Promise<MarketplaceShipment> {
    return apiClient.get<MarketplaceShipment>(`${BASE_PATH}/shipping/${shipmentId}?config_id=${configId}`);
  }

  /**
   * Update shipment tracking.
   */
  async updateShipmentTracking(
    configId: string,
    shipmentId: string,
    trackingNumber: string,
    carrier?: string
  ): Promise<{ status: string; message: string }> {
    return apiClient.put<{ status: string; message: string }>(`${BASE_PATH}/shipping/${shipmentId}/tracking`, {
      config_id: configId,
      tracking_number: trackingNumber,
      carrier,
    });
  }

  /**
   * Get shipping label URL.
   */
  getShippingLabelUrl(configId: string, shipmentId: string): string {
    return `${BASE_PATH}/shipping/${shipmentId}/label?config_id=${configId}`;
  }

  // ============================================
  // METRICS
  // ============================================

  /**
   * Get sales metrics.
   */
  async getSalesMetrics(configId: string, period?: 'day' | 'week' | 'month'): Promise<SalesMetrics> {
    const params = new URLSearchParams({ config_id: configId });
    if (period) params.set('period', period);
    return apiClient.get<SalesMetrics>(`${BASE_PATH}/metrics/sales?${params.toString()}`);
  }

  /**
   * Get visits metrics.
   */
  async getVisitsMetrics(configId: string, productId?: string, period?: 'day' | 'week' | 'month'): Promise<VisitMetrics> {
    const params = new URLSearchParams({ config_id: configId });
    if (productId) params.set('product_id', productId);
    if (period) params.set('period', period);
    return apiClient.get<VisitMetrics>(`${BASE_PATH}/metrics/visits?${params.toString()}`);
  }

  /**
   * Get seller reputation.
   */
  async getReputation(configId: string): Promise<ReputationMetrics> {
    return apiClient.get<ReputationMetrics>(`${BASE_PATH}/metrics/reputation?config_id=${configId}`);
  }

  /**
   * Get full metrics (sales, visits, reputation).
   */
  async getFullMetrics(configId: string): Promise<FullMetrics> {
    return apiClient.get<FullMetrics>(`${BASE_PATH}/metrics/full?config_id=${configId}`);
  }

  // ============================================
  // FEES (Mercado Livre)
  // ============================================

  /**
   * Get category fees from ML.
   */
  async getCategoryFees(
    categoryId: string,
    listingType = 'gold_special',
    configId?: string
  ): Promise<CategoryFees> {
    const params = new URLSearchParams({ listing_type: listingType });
    if (configId) params.set('config_id', configId);
    return apiClient.get<CategoryFees>(`${BASE_PATH}/fees/categories/${categoryId}?${params.toString()}`);
  }

  /**
   * Calculate fees for a given price.
   */
  async calculateFees(
    price: number,
    categoryId: string,
    listingType = 'gold_special',
    configId?: string
  ): Promise<FeeCalculation> {
    return apiClient.post<FeeCalculation>(`${BASE_PATH}/fees/calculate`, {
      price,
      category_id: categoryId,
      listing_type: listingType,
      config_id: configId,
    });
  }

  /**
   * Calculate minimum price for target net revenue.
   */
  async calculateMinimumPrice(
    targetNetRevenue: number,
    categoryId: string,
    listingType = 'gold_special',
    configId?: string
  ): Promise<MinimumPriceCalculation> {
    return apiClient.post<MinimumPriceCalculation>(`${BASE_PATH}/fees/minimum-price`, {
      target_net_revenue: targetNetRevenue,
      category_id: categoryId,
      listing_type: listingType,
      config_id: configId,
    });
  }

  /**
   * Get all listing types from ML.
   */
  async getListingTypes(): Promise<ListingType[]> {
    return apiClient.get<ListingType[]>(`${BASE_PATH}/fees/listing-types`);
  }

  /**
   * Refresh fees cache.
   */
  async refreshFees(configId?: string): Promise<{ message: string; updated: number; errors: number }> {
    return apiClient.post<{ message: string; updated: number; errors: number }>(`${BASE_PATH}/fees/refresh`, {
      config_id: configId,
    });
  }

  // ============================================
  // IMPORT FROM MARKETPLACE (ML → Local)
  // ============================================

  /**
   * Get products from seller's marketplace account.
   */
  async getMarketplaceProducts(
    configId: string,
    params?: {
      status?: 'active' | 'paused' | 'closed';
      limit?: number;
      offset?: number;
    }
  ): Promise<MarketplaceProductsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return apiClient.get<MarketplaceProductsResponse>(
      `${BASE_PATH}/configs/${configId}/products${query ? `?${query}` : ''}`
    );
  }

  /**
   * Get full details of a product from marketplace.
   */
  async getMarketplaceProductDetails(
    configId: string,
    externalProductId: string
  ): Promise<MLProductFull> {
    return apiClient.get<MLProductFull>(
      `${BASE_PATH}/configs/${configId}/products/${externalProductId}`
    );
  }

  /**
   * Download image from marketplace.
   */
  async downloadMarketplaceImage(
    configId: string,
    imageUrl: string
  ): Promise<{ data: string; content_type: string; size: number }> {
    return apiClient.post<{ data: string; content_type: string; size: number }>(
      `${BASE_PATH}/import/download-image`,
      { config_id: configId, image_url: imageUrl }
    );
  }

  /**
   * Link marketplace product to existing local product.
   */
  async linkMarketplaceProduct(
    configId: string,
    externalProductId: string,
    localProductId: string,
    options?: {
      variant_prices?: Array<{
        external_variation_id: number;
        local_variant_id: string;
        marketplace_price: number;
      }>;
      download_images?: boolean;
    }
  ): Promise<LinkProductResponse> {
    return apiClient.post<LinkProductResponse>(`${BASE_PATH}/import/link-product`, {
      config_id: configId,
      external_product_id: externalProductId,
      local_product_id: localProductId,
      variant_prices: options?.variant_prices,
      download_images: options?.download_images ?? true,
    });
  }
}

// ============================================
// ADDITIONAL TYPES
// ============================================

export interface MarketplaceOrder {
  id: number;
  status: string;
  date_created: string;
  date_closed?: string;
  buyer: {
    id: number;
    nickname: string;
    email?: string;
  };
  order_items: Array<{
    item: { id: string; title: string; seller_sku?: string };
    quantity: number;
    unit_price: number;
  }>;
  shipping: { id: number; status: string };
  total_amount: number;
  fee_amount?: number;
}

export interface MarketplaceQuestion {
  id: number;
  item_id: string;
  text: string;
  status: string;
  date_created: string;
  from: { id: number; nickname: string };
  answer?: {
    text: string;
    date_created: string;
  };
}

export interface MarketplaceShipment {
  id: number;
  status: string;
  tracking_number?: string;
  tracking_method?: string;
  status_history?: Array<{
    status: string;
    date: string;
    message?: string;
  }>;
  receiver_address?: {
    city: { name: string };
    state: { name: string };
    zip_code: string;
    street_name: string;
    street_number: string;
  };
}

export interface SalesMetrics {
  period: string;
  total_orders: number;
  total_revenue: number;
  total_fees: number;
  total_units: number;
  average_order_value: number;
  since: string;
  until: string;
}

export interface VisitMetrics {
  period: string;
  total_visits: number;
  items: Array<{ item_id: string; visits: number }>;
  since: string;
  until: string;
}

export interface ReputationMetrics {
  level: string;
  sales: number;
  rating: number;
}

export interface FullMetrics {
  reputation: ReputationMetrics;
  sales: {
    day: SalesMetrics;
    week: SalesMetrics;
    month: SalesMetrics;
  };
  visits: VisitMetrics;
}

// ============================================
// FEES TYPES
// ============================================

export interface CategoryFees {
  id: string;
  provider_code: string;
  category_id: string;
  category_name: string | null;
  listing_type: string;
  listing_fee: number;
  sales_commission_percent: number;
  variation_commission_percent: number | null;
  updated_at: string;
  created_at: string;
}

export interface FeeCalculation {
  category_id: string;
  category_name?: string | null;
  listing_type: string;
  listing_fee: number;
  sales_commission_percent: number;
  estimated_fees: number;
  net_revenue: number;
}

export interface MinimumPriceCalculation {
  minimum_price: number;
  target_net_revenue: number;
  category_id: string;
  category_name?: string | null;
  listing_type: string;
  sales_commission_percent: number;
  listing_fee: number;
  estimated_fees: number;
  net_revenue: number;
}

export interface ListingType {
  id: string;
  name: string;
  site_id: string;
  configuration: {
    listing_exposure: string;
    requires_picture: boolean;
    max_stock_per_item: number;
  };
}

// ============================================
// IMPORT TYPES
// ============================================

export interface MLProductBasic {
  id: string;
  title: string;
  price: number;
  thumbnail: string;
  status: 'active' | 'paused' | 'closed';
  available_quantity: number;
  sold_quantity: number;
  variations?: Array<{
    id: number;
    price: number;
    available_quantity: number;
    attribute_combinations: Array<{ id: string; name: string; value_name: string }>;
  }>;
}

export interface MLProductFull {
  id: string;
  site_id: string;
  title: string;
  price: number;
  base_price: number;
  currency_id: string;
  available_quantity: number;
  sold_quantity: number;
  listing_type_id: string;
  condition: 'new' | 'used' | 'refurbished';
  permalink: string;
  status: 'active' | 'paused' | 'closed';
  category_id: string;
  description_text?: string;
  pictures: Array<{
    id: string;
    url: string;
    secure_url: string;
    size: string;
    max_size: string;
  }>;
  attributes: Array<{
    id: string;
    name: string;
    value_id: string | null;
    value_name: string;
  }>;
  variations: Array<{
    id: number;
    price: number;
    available_quantity: number;
    sold_quantity: number;
    picture_ids: string[];
    attribute_combinations: Array<{
      id: string;
      name: string;
      value_id: string | null;
      value_name: string;
    }>;
    seller_custom_field?: string;
  }>;
  sale_terms: Array<{
    id: string;
    name: string;
    value_name: string;
  }>;
  shipping: {
    mode: string;
    free_shipping: boolean;
    local_pick_up: boolean;
  };
  seller_id: number;
  date_created: string;
  last_updated: string;
}

export interface MarketplaceProductsResponse {
  products: MLProductBasic[];
  total: number;
  offset: number;
  limit: number;
}

export interface LinkProductResponse {
  mapping: MarketplaceProductMapping;
  variant_mappings: MarketplaceProductMapping[];
  external_product: MLProductFull;
  downloaded_images: Array<{
    url: string;
    data: string;
    content_type: string;
  }>;
}

// Singleton instance
export const marketplaceApi = new MarketplaceApi();
