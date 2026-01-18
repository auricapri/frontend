import { LocalizedText } from '../common';
import { ProductDimensions } from './dimensions';
import { VariantAssetLink } from './asset-links';

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
  face_swap_enabled?: boolean;
  cost_price?: number;
  weight_g?: number;
  dimensions?: ProductDimensions;
  correlated_assets?: VariantAssetLink[];
  composition?: LocalizedText;
  care_instructions?: LocalizedText;
  size_guide_id?: string;
}
