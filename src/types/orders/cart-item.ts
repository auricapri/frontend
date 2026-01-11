import { LocalizedText } from '../common';

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
