import { apiClient } from './client';
import type { ProductVariant, Asset, GlobalFinancialSettings } from '../types';
import type { PricingScenarioInput, PriceBreakdown } from '../types/pricing.types';

export interface MatrixScenarioInput {
  channel: PricingScenarioInput['channel'];
  region_uf: string;
  target_margin_percent: number;
  commission_percent: number;
  ads_cac_target: number;
}

export interface CalculateMatrixPayload {
  variants: ProductVariant[];
  assets: Asset[];
  scenario: MatrixScenarioInput;
  hasFreeShipping?: boolean;
  financialSettings?: GlobalFinancialSettings;
}

export interface MatrixResultBreakdown {
  production: number;
  assets: number;
  fixed: number;
  logistics: number;
  marketing: number;
  taxes: number;
  margin: number;
}

export interface MatrixResult {
  suggestedPrice: number;
  breakdown: MatrixResultBreakdown;
}

export interface CalculateMatrixResponse {
  results: Record<string, MatrixResult>;
}

export interface PriceHistoryEntry {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  metadata: any;
  ip_address: string | null;
  created_at: string;
}

export class PricingApi {
  async calculateMatrix(payload: CalculateMatrixPayload): Promise<CalculateMatrixResponse> {
    return apiClient.post<CalculateMatrixResponse>('/pricing/calculate-matrix', payload);
  }

  async getVariantPriceHistory(variantId: string, options?: { limit?: number; offset?: number }): Promise<PriceHistoryEntry[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    const query = params.toString();
    return apiClient.get<PriceHistoryEntry[]>(`/pricing/variant/${variantId}/history${query ? `?${query}` : ''}`);
  }
}

