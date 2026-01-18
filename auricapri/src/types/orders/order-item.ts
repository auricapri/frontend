import { LocalizedText } from '../common';

export interface OrderItem {
  id?: string;
  variant_id?: string;
  product_id: string;
  name: LocalizedText;
  quantity: number;
  price: number;
  image: string;
  size: string;
  color_name: LocalizedText;
}
