export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  exp_month?: number;
  exp_year?: number;
  gateway_token?: string;
}
