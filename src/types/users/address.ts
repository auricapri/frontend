export interface SavedAddress {
  id: string;
  type?: string;
  street_address?: string; // Usado em algumas partes do código
  line1: string;
  line2?: string;
  city: string;
  state: string;
  state_province?: string; // Usado em algumas partes do código
  postal_code: string;
  country: string;
  country_code?: string;
  full_name?: string;
  phone?: string;
  is_default: boolean;
}
