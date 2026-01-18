
export type LocalizedText = {
  en: string;
  pt: string;
  es?: string;
  fr?: string;
  [key: string]: string | undefined;
};

export interface LoyaltyLevel {
  level: number;
  xp_required: number;
  reward_coupon_value: number; // Value in currency
  reward_description: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  cashback_percentage: number; // e.g. 5 for 5%
  xp_per_currency_unit: number; // e.g. 1 XP per $1
  levels: LoyaltyLevel[];
}

export interface UserLoyaltyData {
  current_xp: number;
  current_level: number;
  cashback_balance: number;
  last_seen_level?: number;
  pending_reward_coupon?: {
    code: string;
    value: number;
    expires_at: string;
    level_reached: number;
  } | null;
}

export interface StoreConfig {
  id?: string;
  brand_name: string;
  about_us?: LocalizedText;
  about_us_image?: string;
  terms_of_service: LocalizedText;
  privacy_policy: LocalizedText;
  contact_email?: string;
  support_phone?: string; 
  tax_id?: string;        
  address?: string;       
  financial_settings?: GlobalFinancialSettings;
  loyalty_program?: LoyaltySettings; // New Loyalty Config
}

export type BrazilianTaxRegime = 'mei' | 'simples' | 'presumido' | 'real';

export type PaymentGatewayProvider = 
  | 'stripe' 
  | 'pagarme' 
  | 'mercadopago' 
  | 'asaas' 
  | 'cielo' 
  | 'rede' 
  | 'other';

export interface PaymentGatewaySettings {
  provider: PaymentGatewayProvider;
  fee_percentage: number;
  fee_fixed: number;
  pix_fee_percentage: number;
  pix_fee_fixed: number;
  boleto_fee_fixed: number;
  installment_fee_per_installment: number;
  max_installments: number;
}

export interface CostStructureSettings {
  devolution_rate: number;
  reprocessing_cost: number;
  loss_rate: number;
  storage_rate: number;
  weight_surcharge_threshold_g: number;
  weight_surcharge_amount: number;
}

export interface GlobalFinancialSettings {
  fixed_monthly: number;       
  infra_tech: number;          
  monthly_sales_vol: number;   
  das_mei: number;             
  marketing_fixed: number;     
  packaging_cost: number; 
  avg_freight_cost: number;
  tax_regime: BrazilianTaxRegime;
  origin_state: string;
  origin_cep: string;
  payment_gateway?: PaymentGatewaySettings;
  cost_structure?: CostStructureSettings;
}

export const DEFAULT_FINANCIAL_SETTINGS: GlobalFinancialSettings = {
  fixed_monthly: 500,
  infra_tech: 200,
  monthly_sales_vol: 100,
  das_mei: 71.60,
  marketing_fixed: 300,
  packaging_cost: 5,
  avg_freight_cost: 25,
  tax_regime: 'mei',
  origin_state: 'SP',
  origin_cep: '01310100',
  payment_gateway: {
    provider: 'other',
    fee_percentage: 0.0399,
    fee_fixed: 0.50,
    pix_fee_percentage: 0.0099,
    pix_fee_fixed: 0,
    boleto_fee_fixed: 3.49,
    installment_fee_per_installment: 0.0199,
    max_installments: 12
  },
  cost_structure: {
    devolution_rate: 0.03,
    reprocessing_cost: 10,
    loss_rate: 0.05,
    storage_rate: 0.02,
    weight_surcharge_threshold_g: 1000,
    weight_surcharge_amount: 5
  }
};

export interface Asset {
  id: string;
  name: string;
  cost_price: number; 
  stock_quantity: number; 
  min_stock_level?: number; 
  image_url?: string; 
  weight_g?: number;
}

export interface SizeGuide {
  id: string;
  name: string;
  image_url: string;
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
  composition?: LocalizedText;
  care_instructions?: LocalizedText;
  size_guide_id?: string;
}

export interface PricingScenario {
  id: string;
  name: string;
  channel: 'ecommerce' | 'marketplace' | 'wholesale';
  region_uf: string;
  tax_rate_percent?: number;
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
  has_free_shipping?: boolean;
  pricing_scenarios?: PricingScenario[];
  pricing_variables?: Record<string, unknown>[];
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
  seo_metadata?: Record<string, unknown>;
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
  VAREJO = 'VAREJO',
  ATACADO = 'ATACADO'
}

export interface SavedAddress {
  id: string;
  type?: string;
  street_address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code?: string;
  full_name?: string;
  phone?: string;
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
  loyalty?: UserLoyaltyData; // New Loyalty Data
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
  method?: string;
  real_cost: number;        
  estimated_days: number;   
  display_price_was: number;
  display_days_was: number; 
}

export interface AddressData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  cep?: string;
  numero?: string;
  complemento?: string;
  erro?: boolean;
}

export interface LogisticsMetadata {
  total_weight_g: number;
  box_dimensions: string; 
  doc_generated_at?: string;
  doc_url?: string; 
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
  shipping_address_snapshot?: AddressData;
  logistics_metadata?: LogisticsMetadata;
  wishlist_slug?: string | null; // Slug of shared wishlist if purchased via wishlist
  gift_from_user_id?: string | null; // User who bought the gift
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

