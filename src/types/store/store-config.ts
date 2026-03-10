import { LocalizedText } from '../common';
import { GlobalFinancialSettings } from './financial-settings';
import { LoyaltySettings } from '../users/loyalty';

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
  pix_key?: string; // Adicionado para suportar pagamentos via PIX
  financial_settings?: GlobalFinancialSettings;
  loyalty_program?: LoyaltySettings;
}

export interface Banner {
  id?: string;
  title: LocalizedText;
  image_url: LocalizedText;
  link_url?: string;
  position: string;
  is_active: boolean;
  sort_order: number;
  starts_at?: string;
  ends_at?: string;
}

export interface Coupon {
  id?: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  is_influencer?: boolean;
  min_purchase_amount?: number;
  expires_at?: string;
  product_ids?: string[];
}

export interface SizeGuide {
  id: string;
  name: string;
  image_url: string;
}

export interface FAQItem {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  sort_order: number;
  is_active: boolean;
  category?: string; // Optional category for grouping FAQs
  created_at?: string;
  updated_at?: string;
}
