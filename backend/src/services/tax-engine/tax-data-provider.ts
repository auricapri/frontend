import type { BrazilianState, IcmsRate, IpiRate, IssRate, StRule } from './types.js';

export interface TaxDataProvider {
  getIcmsRate(originState: BrazilianState, destinationState: BrazilianState): Promise<IcmsRate>;
  getIpiRateByNcm(ncm: string): Promise<IpiRate | null>;
  getIssRate(cityIbge: string, serviceCode?: string): Promise<IssRate | null>;
  getStRule(params: { destinationState: BrazilianState; ncm: string; cest?: string | null; originState?: BrazilianState | null }): Promise<StRule | null>;
  getDataVersion(name: string): Promise<string | null>;
}

