import { LocalizedText } from '../common';
import { ProductVariant } from './variant';
import { Product } from './product';

/**
 * Product Image Hotspot - Interactive points on product images
 * that link to other product variants (Shoppable Images)
 */
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

/**
 * Hotspot for creation/update (without populated relations)
 */
export type HotspotInput = Omit<ProductImageHotspot, 'id' | 'created_at' | 'updated_at' | 'linked_variant' | 'linked_product'>;
