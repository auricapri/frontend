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

export interface SizeGuide {
  id: string;
  name: string;
  image_url: string;
}
