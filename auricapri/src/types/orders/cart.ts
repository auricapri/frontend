import { CartItem } from './cart-item';

export interface CartSession {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  items_count: number;
  total_value: number;
  status: 'active' | 'checkout_started' | 'abandoned';
  last_updated: string;
  items_preview: CartItem[];
}
