/**
 * Marketplace Integration Types (Frontend)
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
  token_expires_at: string | null;
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
  config?: MarketplaceConfig;
}

export interface MappingInput {
  config_id: string;
  product_id: string;
  variant_id?: string | null;
  external_product_id?: string | null;
  external_sku?: string | null;
  external_url?: string | null;
  marketplace_price?: number | null;
}

// ============================================
// Sync Log Types
// ============================================

export type SyncAction = 'create_product' | 'update_product' | 'delete_product' | 'update_stock' | 'update_price' | 'sync_orders' | 'test_connection' | 'refresh_token';
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
  config?: {
    id: string;
    environment: string;
    status: string;
    provider: {
      code: string;
      name: string;
    };
  };
}

// ============================================
// Sync Result Types
// ============================================

export interface SyncResult {
  provider: string;
  status: 'success' | 'error' | 'skipped';
  external_id?: string;
  error?: string;
  duration_ms?: number;
}

export interface SyncStats {
  totalMappings: number;
  synced: number;
  pending: number;
  errors: number;
  lastSync: string | null;
}

export interface LogStats {
  total: number;
  success: number;
  error: number;
  partial: number;
  byAction: Record<SyncAction, { total: number; success: number; error: number }>;
}

// ============================================
// UI State Types
// ============================================

export interface MarketplaceIntegrationState {
  providers: MarketplaceProvider[];
  configs: MarketplaceConfig[];
  mappings: MarketplaceProductMapping[];
  logs: MarketplaceSyncLog[];
  stats: SyncStats | null;
  selectedConfigId: string | null;
  selectedProductId: string | null;
  isLoading: boolean;
  error: string | null;
}
