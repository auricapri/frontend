
export type LocalizedText = {
  en: string;
  pt: string;
  es?: string;
  fr?: string;
  [key: string]: string | undefined;
};

export interface StoreConfig {
  id?: string;
  brand_name: string;
  terms_of_service: LocalizedText;
  privacy_policy: LocalizedText;
  contact_email?: string;
  support_phone?: string;
  financial_settings?: GlobalFinancialSettings;
}

export interface GlobalFinancialSettings {
  fixed_monthly: number;       
  infra_tech: number;          
  monthly_sales_vol: number;   
  das_mei: number;             
  marketing_fixed: number;     
  packaging_cost: number; 
  avg_freight_cost: number;    
}

export interface Asset {
  id: string;
  name: string;
  cost_price: number; 
  stock_quantity: number; 
  min_stock_level?: number; 
  image_url?: string; 
  weight_g?: number; // Added for logistics calc
}

export interface VariantAssetLink {
  asset_id: string;
  quantity_required: number; 
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size?: string;
  color_name: LocalizedText;
  color_hex?: string;
  retail_price: number;
  wholesale_price: number;
  stock_quantity: number;
  variant_images: string[];
  attributes?: Record<string, any>;
  is_active: boolean;
  cost_price?: number; 
  weight_g?: number;   
  dimensions?: ProductDimensions; 
  correlated_assets?: VariantAssetLink[]; 
}

export interface PricingScenario {
  id: string;
  name: string;
  channel: 'ecommerce' | 'marketplace' | 'wholesale';
  region_uf: string;
  tax_rate_percent: number;   
  ads_cac_target: number;     
  commission_percent: number; 
  target_margin_percent: number; 
}

export interface Product {
  id: string;
  category_id: string;
  collection_ids?: string[];
  name: LocalizedText;
  description: LocalizedText;
  slug: LocalizedText;
  is_active: boolean;
  is_highlight: boolean;
  pricing_scenarios?: PricingScenario[];
  pricing_variables?: any[];
  base_images: string[];
  default_image_url?: string;
  created_at?: string;
  variants?: ProductVariant[];
  average_rating?: number;
  total_reviews?: number;
}

export interface CartItem {
  variant_id: string;
  product_id: string;
  name: LocalizedText;
  image: string;
  size: string;
  color_name: LocalizedText;
  color_hex: string;
  price: number;
  quantity: number;
  sku: string;
}

export interface Category {
  id: string;
  name: LocalizedText;
  slug: string;
  image_url?: string;
  is_active: boolean;
  _associatedProductIds?: string[];
}

export interface Collection {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  slug: string;
  image_url?: string;
  is_active: boolean;
  seo_metadata?: any;
  _associatedProductIds?: string[];
}

export interface Banner {
  id?: string;
  title: LocalizedText;
  image_url: LocalizedText;
  link_url?: string;
  position: string;
  is_active: boolean;
  sort_order: number;
}

export interface Coupon {
  id?: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  min_purchase_amount?: number;
  expires_at?: string;
  product_ids?: string[];
}

export enum UserMode {
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE'
}

export interface SavedAddress {
  id: string;
  line1: string; 
  line2?: string; 
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  exp_month?: number;
  exp_year?: number;
  gateway_token?: string; 
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  affiliate_code?: string;
  avatar_url?: string;
  role: 'admin' | 'customer' | 'editor' | 'affiliate';
  default_address?: SavedAddress;
  saved_cards?: SavedCard[]; 
}

export interface OrderItem {
  id?: string;
  variant_id?: string;
  product_id: string;
  name: LocalizedText;
  quantity: number;
  price: number;
  image: string;
  size: string;
  color_name: LocalizedText;
}

export interface InternalLogisticsInfo {
  selected_carrier: string; 
  real_cost: number;        
  estimated_days: number;   
  display_price_was: number;
  display_days_was: number; 
}

export interface LogisticsMetadata {
  total_weight_g: number;
  box_dimensions: string; // e.g. "30x20x15"
  doc_generated_at?: string;
  doc_url?: string; // If present, document is generated
}

export interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  subtotal?: number; 
  discount_amount?: number; 
  shipping_cost?: number;
  payment_method?: 'credit_card' | 'pix';
  items: OrderItem[];
  tracking_code?: string;
  internal_logistics?: InternalLogisticsInfo;
  shipping_address_snapshot?: any;
  logistics_metadata?: LogisticsMetadata; // New Field for Strict Expedition Flow
}

export interface CartSession {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  items_count: number;
  total_value: number;
  status: 'active' | 'checkout_started' | 'abandoned';
  last_updated: string;
  items_preview: CartItem[];
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}
