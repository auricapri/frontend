import { AddressData } from '../orders/logistics';

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
  categories?: string[] | null;
  material_rating?: number | null;
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
