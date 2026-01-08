export type BrazilianTaxRegime = 'mei' | 'simples' | 'presumido' | 'real';

export type PaymentGatewayProvider = 
  | 'stripe' 
  | 'pagarme' 
  | 'mercadopago' 
  | 'asaas' 
  | 'cielo' 
  | 'rede' 
  | 'other';

export interface PaymentGatewayConfig {
  id?: string;
  provider: PaymentGatewayProvider;
  isActive: boolean;
  feePercentage: number;
  feeFixed: number;
  pixFeePercentage: number;
  pixFeeFixed: number;
  boletoFeeFixed: number;
  installmentFeePercentPerInstallment: number;
  maxInstallments: number;
}

export interface ICMSRate {
  originState: string;
  destinationState: string;
  rateInternal: number;
  rateInterstate: number;
  difalApplicable: boolean;
}

export interface CostStructureConfig {
  id?: string;
  name: string;
  isActive: boolean;
  devolutionRate: number;
  reprocessingCost: number;
  lossRate: number;
  storageRate: number;
  defaultPackagingCost: number;
  weightSurchargeThresholdG: number;
  weightSurchargeAmount: number;
}

export interface TaxBreakdown {
  regime: BrazilianTaxRegime;
  dasProportional: number;
  icms: number;
  pis: number;
  cofins: number;
  ipiIfApplicable: number;
  totalTaxAmount: number;
  effectiveTaxRate: number;
}

export interface FreightQuote {
  provider: string;
  serviceCode: string;
  serviceName: string;
  price: number;
  deliveryDays: number;
  quotedAt: Date;
  expiresAt: Date;
}

export interface FreightCalculationInput {
  originCep: string;
  destinationCep: string;
  weightG: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  declaredValue: number;
}

export interface CostBreakdown {
  productionCost: number;
  assetsCost: number;
  fixedCostAllocation: number;
  devolutionCost: number;
  storageCost: number;
  lossCost: number;
  freightCost: number;
  marketingCost: number;
  totalBaseCost: number;
}

export interface PriceBreakdown {
  baseCost: CostBreakdown;
  taxes: TaxBreakdown;
  gatewayFee: number;
  targetMargin: number;
  targetMarginAmount: number;
  suggestedPrice: number;
  finalPrice: number;
}

export interface OrderEconomics {
  revenue: number;
  cogs: number;
  freightReal: number;
  gatewayFee: number;
  dasProportional: number;
  totalVariableCosts: number;
  netProfit: number;
  marginPercent: number;
}

export interface PricingScenarioInput {
  channel: 'ecommerce' | 'marketplace' | 'wholesale';
  regionUf: string;
  targetMarginPercent: number;
  commissionPercent: number;
  adsCacTarget: number;
}

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface MelhorEnvioQuote {
  id: number;
  name: string;
  price: string;
  custom_price: string;
  discount: string;
  currency: string;
  delivery_time: number;
  delivery_range: {
    min: number;
    max: number;
  };
  custom_delivery_time: number;
  custom_delivery_range: {
    min: number;
    max: number;
  };
  packages: Array<{
    price: string;
    discount: string;
    format: string;
    dimensions: {
      height: number;
      width: number;
      length: number;
    };
    weight: string;
    insurance_value: string;
  }>;
  company: {
    id: number;
    name: string;
    picture: string;
  };
  error?: string;
}

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
] as const;

export type BrazilianState = typeof BRAZILIAN_STATES[number];

export const MEI_ANNUAL_LIMIT = 81000;
export const MEI_MONTHLY_LIMIT = MEI_ANNUAL_LIMIT / 12;

export const MEI_DAS_COMMERCE = 71.60;
export const MEI_DAS_SERVICES = 75.60;
export const MEI_DAS_MIXED = 76.60;

export const DEFAULT_COST_STRUCTURE: CostStructureConfig = {
  name: 'default',
  isActive: true,
  devolutionRate: 0.03,
  reprocessingCost: 10,
  lossRate: 0.05,
  storageRate: 0.02,
  defaultPackagingCost: 5,
  weightSurchargeThresholdG: 1000,
  weightSurchargeAmount: 5
};

export const DEFAULT_GATEWAY_CONFIG: PaymentGatewayConfig = {
  provider: 'other',
  isActive: true,
  feePercentage: 0.0399,
  feeFixed: 0.50,
  pixFeePercentage: 0.0099,
  pixFeeFixed: 0,
  boletoFeeFixed: 3.49,
  installmentFeePercentPerInstallment: 0.0199,
  maxInstallments: 12
};

