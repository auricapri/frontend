/**
 * Marketplace Integration Types
 */

// ============================================
// Provider Types
// ============================================

export interface RequiredField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select';
  required: boolean;
  help?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface OAuthConfig {
  auth_url: string;
  token_url: string;
  scopes: string[];
}

export interface ProviderRequiredFields {
  fields: RequiredField[];
  oauth: OAuthConfig | null;
}

export interface MarketplaceProvider {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  base_url: string;
  auth_type: 'oauth2' | 'api_key' | 'bearer';
  required_fields: ProviderRequiredFields;
  commission_default: number | null;
  documentation_url: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================
// Config Types
// ============================================

export type MarketplaceEnvironment = 'sandbox' | 'production';
export type MarketplaceStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface MarketplaceConfig {
  id: string;
  provider_id: string;
  environment: MarketplaceEnvironment;
  credentials_encrypted: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  ml_category_id: string | null; // Mercado Livre category for fee calculations
  commission_override: number | null;
  price_markup_percent: number;
  auto_sync_stock: boolean;
  auto_sync_price: boolean;
  sync_interval_minutes: number;
  last_sync_at: string | null;
  status: MarketplaceStatus;
  status_message: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  provider?: MarketplaceProvider;
}

export interface MarketplaceConfigInput {
  provider_id: string;
  environment?: MarketplaceEnvironment;
  credentials: Record<string, string>;
  commission_override?: number | null;
  price_markup_percent?: number;
  auto_sync_stock?: boolean;
  auto_sync_price?: boolean;
  sync_interval_minutes?: number;
}

export interface MarketplaceConfigUpdate {
  environment?: MarketplaceEnvironment;
  credentials?: Record<string, string>;
  commission_override?: number | null;
  price_markup_percent?: number;
  auto_sync_stock?: boolean;
  auto_sync_price?: boolean;
  sync_interval_minutes?: number;
  is_active?: boolean;
}

// ============================================
// Product Mapping Types
// ============================================

export type SyncStatus = 'pending' | 'synced' | 'error' | 'paused';

export interface MarketplaceProductMapping {
  id: string;
  config_id: string;
  product_id: string;
  variant_id: string | null;
  external_product_id: string | null;
  external_variation_id: string | null; // ML variation ID within the product
  external_sku: string | null;
  external_url: string | null;
  marketplace_price: number | null;
  marketplace_stock: number | null;
  sync_status: SyncStatus;
  last_sync_at: string | null;
  sync_error: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Joined data
  config?: MarketplaceConfig;
}

export interface MappingInput {
  config_id: string;
  product_id: string;
  variant_id?: string | null;
  external_product_id?: string | null;
  external_variation_id?: string | null; // ML variation ID
  external_sku?: string | null;
  external_url?: string | null;
  marketplace_price?: number | null;
  marketplace_stock?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface MappingUpdate {
  external_product_id?: string | null;
  external_variation_id?: string | null; // ML variation ID
  external_sku?: string | null;
  external_url?: string | null;
  marketplace_price?: number | null;
  marketplace_stock?: number | null;
  sync_status?: SyncStatus;
  sync_error?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ============================================
// Sync Log Types
// ============================================

export type SyncAction = 'create_product' | 'update_product' | 'delete_product' | 'update_stock' | 'update_price' | 'sync_orders' | 'test_connection' | 'refresh_token' | 'answer_question' | 'update_shipment';
export type SyncLogStatus = 'success' | 'error' | 'partial';

export interface MarketplaceSyncLog {
  id: string;
  config_id: string;
  mapping_id: string | null;
  action: SyncAction;
  status: SyncLogStatus;
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
  // Joined data
  config?: MarketplaceConfig;
  mapping?: MarketplaceProductMapping;
}

export interface SyncLogInput {
  config_id: string;
  mapping_id?: string | null;
  action: SyncAction;
  status: SyncLogStatus;
  request_payload?: Record<string, unknown> | null;
  response_payload?: Record<string, unknown> | null;
  error_message?: string | null;
  duration_ms?: number | null;
}

// ============================================
// Provider Service Types
// ============================================

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface ExternalProduct {
  id: string;
  sku?: string;
  url?: string;
  title?: string;
  price?: number;
  stock?: number;
  status?: string;
}

export interface ProductPayload {
  title: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  images: string[];
  category_id?: string;
  attributes?: Record<string, string | number>;
  variants?: Array<{
    sku: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  }>;
}

export interface CategoryMapping {
  local_id: string;
  external_id: string;
  name: string;
  path?: string[];
}

export interface SyncResult {
  provider: string;
  status: 'success' | 'error' | 'skipped';
  external_id?: string;
  error?: string;
  duration_ms?: number;
}

// ============================================
// Query Types
// ============================================

export interface MappingQuery {
  config_id?: string;
  product_id?: string;
  variant_id?: string;
  sync_status?: SyncStatus;
  limit?: number;
  offset?: number;
}

export interface SyncLogQuery {
  config_id?: string;
  mapping_id?: string;
  action?: SyncAction;
  status?: SyncLogStatus;
  limit?: number;
  offset?: number;
}

// ============================================
// Mercado Livre Variation Types
// ============================================

export interface MLAttributeCombination {
  id: string; // e.g., 'SIZE', 'COLOR'
  value_name: string; // e.g., 'P', 'Azul'
}

export interface MLVariation {
  id?: number; // ML's variation ID (returned after creation)
  attribute_combinations: MLAttributeCombination[];
  price: number;
  available_quantity: number;
  seller_custom_field?: string; // Our SKU
  picture_ids?: string[]; // ML picture IDs for this variation
}

export interface MLProductPayload {
  title: string;
  description?: { plain_text: string };
  category_id: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  buying_mode: 'buy_it_now';
  condition: 'new' | 'used';
  listing_type_id: 'gold_special' | 'gold_pro' | 'gold' | 'silver' | 'bronze' | 'free';
  pictures: Array<{ source: string }>;
  attributes?: Array<{ id: string; value_name: string }>;
  variations?: MLVariation[];
  seller_custom_field?: string; // Our SKU (for products without variations)
  shipping?: {
    mode: 'me2' | 'custom' | 'not_specified';
    free_shipping?: boolean;
    local_pick_up?: boolean;
  };
}

// ============================================
// Category Fees Types
// ============================================

export interface MarketplaceCategoryFees {
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
  listing_fee: number;
  sales_commission_percent: number;
  estimated_fees: number; // For a given price
  net_revenue: number; // Price - fees
}

export interface MLCategorySettings {
  id: string;
  name: string;
  listing_allowed: boolean;
  listing_fee?: number;
  sale_fee_percentage?: number;
}
