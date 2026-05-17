import { LocalizedText } from '../common';

export interface Collection {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  slug: string;
  image_url?: string;
  is_active: boolean;
  seo_metadata?: any; // allow: pragmatic any
  _associatedProductIds?: string[];
  // Limited-time collection fields
  starts_at?: string | null;  // ISO date string
  ends_at?: string | null;    // ISO date string
}
