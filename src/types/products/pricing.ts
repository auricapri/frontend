export interface PricingScenario {
  id: string;
  name: string;
  channel: 'ecommerce' | 'marketplace' | 'wholesale';
  region_uf: string;
  tax_rate_percent?: number;
  ads_cac_target: number;
  commission_percent: number;
  target_margin_percent: number;
}
