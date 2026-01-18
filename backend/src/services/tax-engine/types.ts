export type BrazilianTaxRegime = 'mei' | 'simples' | 'presumido' | 'real';

export type BrazilianState =
  | 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' | 'MA' | 'MG' | 'MS' | 'MT'
  | 'PA' | 'PB' | 'PE' | 'PI' | 'PR' | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO';

export type TaxCode =
  | 'ICMS'
  | 'DIFAL'
  | 'FCP'
  | 'IPI'
  | 'PIS'
  | 'COFINS'
  | 'ISS'
  | 'IRPJ'
  | 'CSLL'
  | 'DAS';

export interface TaxLine {
  code: TaxCode;
  base: number;
  rate: number;
  amount: number;
  meta?: Record<string, unknown>;
}

export interface TaxComputationInput {
  revenue: number;
  regime: BrazilianTaxRegime;
  originState: BrazilianState;
  destinationState: BrazilianState;
  destinationCityIbge?: string;
  ncm?: string;
  cest?: string;
  productType: 'goods' | 'service';
  applySt: boolean;
  applyDifal: boolean;
  consumerFinalNonContributor: boolean;
  annualRevenue?: number;
  monthlyRevenue?: number;
}

export interface TaxComputationResult {
  regime: BrazilianTaxRegime;
  lines: TaxLine[];
  totalTaxAmount: number;
  effectiveTaxRate: number;
}

export interface IcmsRate {
  originState: BrazilianState;
  destinationState: BrazilianState;
  rateInternal: number;
  rateInterstate: number;
  difalApplicable: boolean;
}

export interface StRule {
  originState?: BrazilianState | null;
  destinationState: BrazilianState;
  ncm: string;
  cest?: string | null;
  mva: number;
  internalRate: number;
  interstateRate?: number | null;
  fcpRate?: number | null;
  isActive: boolean;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface IpiRate {
  ncm: string;
  rate: number;
  isActive: boolean;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface IssRate {
  cityIbge: string;
  serviceCode?: string | null;
  rate: number;
  isActive: boolean;
}
