import { LocalizedText } from '../common';
import { ProductVariant } from './variant';
import { PricingScenario } from './pricing';
import { Gender } from '../../constants/enums';

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
  gender?: Gender; // Gênero do produto (feminino, masculino, unissex)
  pricing_scenarios?: PricingScenario[];
  pricing_variables?: any[];
  base_images: string[];
  default_image_url?: string;
  created_at?: string;
  variants?: ProductVariant[];
  average_rating?: number;
  total_reviews?: number;
}
