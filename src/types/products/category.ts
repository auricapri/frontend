import { LocalizedText } from '../common';

export interface Category {
  id: string;
  name: LocalizedText;
  slug: string;
  image_url?: string;
  is_active: boolean;
  _associatedProductIds?: string[];
}
