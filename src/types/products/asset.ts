export interface Asset {
  id: string;
  name: string;
  cost_price: number;
  stock_quantity: number;
  min_stock_level?: number;
  image_url?: string;
  weight_g?: number;
}
