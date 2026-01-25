/**
 * Tipos de logística para pedidos
 * NOTA: Mantenha sincronizado com backend/src/shared/types/index.ts
 */
import { OrderStatus } from '../../constants/enums';

export interface InternalLogisticsInfo {
  selected_carrier: string;
  method?: string;
  real_cost: number;
  estimated_days: number;
  display_price_was: number;
  display_days_was: number;
}

/**
 * Extended logistics type that accepts multiple field naming conventions.
 * Used for API input normalization.
 */
export interface LogisticsInfoInput {
  // Standard names
  selected_carrier?: string;
  method?: string;
  real_cost?: number;
  estimated_days?: number;
  display_price_was?: number;
  display_days_was?: number;
  // Alternative names
  provider?: string;
  carrier?: string;
  service?: string;
  cost?: number;
}

/**
 * Order status history entry returned by the status history endpoint.
 */
export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_at: string;
  changed_by?: string;
  notes?: string;
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

/**
 * Extended address type that accepts both Portuguese (ViaCEP) and English field names.
 * Used for API input normalization.
 */
export interface AddressDataInput {
  // Portuguese names (from ViaCEP)
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  numero?: string;
  complemento?: string;
  // English names (from frontend forms)
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  number?: string;
  complement?: string;
  // Common fields
  cep?: string;
  country?: string;
  erro?: boolean;
}

export interface LogisticsMetadata {
  total_weight_g: number;
  box_dimensions: string;
  doc_generated_at?: string;
  doc_url?: string;
}
