import { LocalizedText } from '../common';

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
