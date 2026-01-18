export interface InternalLogisticsInfo {
  selected_carrier: string;
  method?: string;
  real_cost: number;
  estimated_days: number;
  display_price_was: number;
  display_days_was: number;
}

export interface AddressData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  cep?: string;
  numero?: string;
  complemento?: string;
  erro?: boolean;
}

export interface LogisticsMetadata {
  total_weight_g: number;
  box_dimensions: string;
  doc_generated_at?: string;
  doc_url?: string;
}
