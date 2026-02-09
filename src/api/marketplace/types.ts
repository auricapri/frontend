/**
 * Marketplace API Types
 */

// Re-export core types from central location
export type {
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
} from '../../types/marketplace';

// ============================================
// ORDER TYPES
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

// ============================================
// METRICS TYPES
// ============================================

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
  mapping: import('../../types/marketplace').MarketplaceProductMapping;
  variant_mappings: import('../../types/marketplace').MarketplaceProductMapping[];
  external_product: MLProductFull;
  downloaded_images: Array<{
    url: string;
    data: string;
    content_type: string;
  }>;
}

// ============================================
// FINANCIAL TYPES
// ============================================

export interface MarketplaceBalance {
  provider: string;
  balance: number;
  pending: number;
  total: number;
  currency: string;
  lastUpdate: string;
}

export interface MarketplaceSalesSummary {
  totalOrders: number;
  totalRevenue: number;
  totalFees: number;
  netRevenue: number;
}
