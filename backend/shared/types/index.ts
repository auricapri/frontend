import { OrderStatus, PaymentMethod } from './enums.js';

export { OrderStatus, PaymentMethod };

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
  reward_coupon_value: number;
  reward_description: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  cashback_percentage: number;
  xp_per_currency_unit: number;
  review_cashback_amount?: number;
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
  loyalty_program?: LoyaltySettings;
}

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
  attributes?: Record<string, unknown>;
  is_active: boolean;
  face_swap_enabled?: boolean;
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
  supplier_id?: string;
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
  original_price?: number;
  quantity: number;
  sku: string;
  applied_coupon_code?: string;
}

export interface Category {
  id: string;
  name: LocalizedText;
  slug: string;
  image_url?: string;
  is_active: boolean;
}

export interface Collection {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  slug: string;
  image_url?: string;
  is_active: boolean;
  seo_metadata?: Record<string, unknown>;
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
  role: 'admin' | 'customer' | 'editor' | 'affiliate' | 'delivery';
  default_address?: SavedAddress;
  saved_cards?: SavedCard[];
  loyalty?: UserLoyaltyData;
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
  sku?: string;
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

export interface Supplier {
  id: string;
  store_name: string;
  image_url?: string | null;
  facade_image_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  guarantees_stock: boolean;
  address?: AddressData | null;
  phone?: string | null;
  email?: string | null;
  comments?: string | null;
  cnpj?: string | null;
  contact_person?: string | null;
  payment_terms?: string | null;
  delivery_time?: string | null;
  minimum_order_quantity?: number | null;
  minimum_wholesale_value?: number | null;
  website?: string | null;
  notes?: string | null;
  average_rating: number;
  total_reviews: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierReview {
  id: string;
  supplier_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment?: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface LogisticsMetadata {
  total_weight_g: number;
  box_dimensions: string;
  doc_generated_at?: string;
  doc_url?: string;
}

export interface Order {
  id: string;
  user_id?: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  subtotal?: number;
  discount_amount?: number;
  shipping_cost?: number;
  payment_method?: PaymentMethod;
  items: OrderItem[];
  tracking_code?: string;
  internal_logistics?: InternalLogisticsInfo;
  shipping_address_snapshot?: AddressData;
  logistics_metadata?: LogisticsMetadata;
  wishlist_slug?: string | null;
  gift_from_user_id?: string | null;
  client_ip?: string | null;
  coupon_id?: string | null;
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

export interface ProductReview {
  id: string;
  order_id: string;
  order_item_id: string;
  product_id: string;
  variant_id?: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment: string | null;
  helpful_count: number;
  cashback_awarded: boolean;
  variant_size?: string;
  variant_color?: string;
  created_at: string;
  updated_at: string;
  media?: ProductReviewMedia[];
  user_has_helped?: boolean;
}

export interface ProductReviewMedia {
  id: string;
  review_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  file_size: number;
  file_name: string;
  created_at: string;
}

export interface OrderItemForReview {
  order_item_id: string;
  product_id: string;
  variant_id?: string;
  product_name: LocalizedText | string;
  variant_size: string;
  variant_color: LocalizedText | string;
  image: string;
  quantity: number;
  price: number;
  has_review: boolean;
  review?: ProductReview;
}

export interface BoardColumn {
  id: string;
  title: string;
  color: string;
  position: number;
}

export interface DreamBoard {
  id: string;
  name: string;
  description?: string;
  columns: BoardColumn[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  is_active: boolean;
}

export interface DiagramComment {
  id: string;
  text: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface DiagramVariant {
  variantId: string;
  productId: string;
  sku: string;
  color?: string;
  colorHex?: string;
  size?: string;
  retail_price: number;
  wholesale_price: number;
  cost_price?: number;
  stock_quantity: number;
  isModified?: boolean;
}

export interface ModifiedProduct {
  productId: string;
  productName: string;
  changes: Record<string, unknown>;
}

export interface ModifiedVariant {
  variantId: string;
  productId: string;
  changes: Record<string, unknown>;
}

export interface DiagramMetadata {
  mainProductId?: string;
  resultNodeId?: string;
  description?: string;
  flowType?: 'cost' | 'revenue' | 'mixed';
  totalVariables?: Record<string, number>;
  finalResult?: number;
  modifiedProducts?: ModifiedProduct[];
  modifiedVariants?: ModifiedVariant[];
  templateType?: 'cost' | 'revenue' | 'collection' | 'custom';
}

export interface DiagramData {
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  metadata?: DiagramMetadata;
}

export interface DreamCardMetadata {
  diagram?: DiagramData;
  associated_assets?: string[];
  associated_collections?: string[];
  strategy?: string;
  draft_product_id?: string;
  draft_collection_id?: string;
  draft_category_id?: string;
}

export interface DreamCard {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description?: string;
  image_url?: string;
  category_id?: string;
  position: number;
  metadata: DreamCardMetadata;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  comments_count?: number;
}

export interface DreamComment {
  id: string;
  card_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface OrderReview {
  id: string;
  order_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  media?: OrderReviewMedia[];
  user_has_helped?: boolean;
}

export interface OrderReviewMedia {
  id: string;
  review_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  file_size: number;
  file_name: string;
  created_at: string;
}

// Product Image Hotspots (Shoppable Images)
export interface ProductImageHotspot {
  id: string;
  product_id: string;
  image_url: string;
  x_percent: number;
  y_percent: number;
  linked_variant_id: string;
  label?: LocalizedText;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Populated on fetch
  linked_variant?: ProductVariant;
  linked_product?: Product;
}
