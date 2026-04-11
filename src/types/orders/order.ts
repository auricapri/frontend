import { OrderStatus, PaymentMethod } from '../../constants/enums';
import { OrderItem } from './order-item';
import { InternalLogisticsInfo, AddressData, LogisticsMetadata } from './logistics';

export interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  subtotal?: number;
  discount_amount?: number;
  shipping_cost?: number;
  payment_method?: PaymentMethod;
  items: OrderItem[];
  tracking_code?: string;
  internal_logistics?: InternalLogisticsInfo;
  shipping_address_snapshot?: AddressData;
  logistics_metadata?: LogisticsMetadata;
  wishlist_slug?: string | null;
  gift_from_user_id?: string | null;
  user_id?: string;
  cashback_used?: number;
  expires_at?: string | null;
}
