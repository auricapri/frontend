export type BrazilianTaxRegime = 'mei' | 'simples' | 'presumido' | 'real';

export type PaymentGatewayProvider =
  | 'stripe'
  | 'pagarme'
  | 'mercadopago'
  | 'asaas'
  | 'cielo'
  | 'rede'
  | 'other';

export interface PaymentGatewaySettings {
  provider: PaymentGatewayProvider;
  fee_percentage: number;
  fee_fixed: number;
  pix_fee_percentage: number;
  pix_fee_fixed: number;
  boleto_fee_fixed: number;
  installment_fee_per_installment: number;
  max_installments: number;
}

export interface CostStructureSettings {
  devolution_rate: number;
  reprocessing_cost: number;
  loss_rate: number;
  storage_rate: number;
  weight_surcharge_threshold_g: number;
  weight_surcharge_amount: number;
}

export interface GlobalFinancialSettings {
  fixed_monthly: number;
  infra_tech: number;
  monthly_sales_vol: number;
  das_mei: number;
  marketing_fixed: number;
  packaging_cost: number;
  avg_freight_cost: number;
  tax_regime: BrazilianTaxRegime;
  origin_state: string;
  origin_cep: string;
  payment_gateway?: PaymentGatewaySettings;
  cost_structure?: CostStructureSettings;
}

export const DEFAULT_FINANCIAL_SETTINGS: GlobalFinancialSettings = {
  fixed_monthly: 500,
  infra_tech: 200,
  monthly_sales_vol: 100,
  das_mei: 71.60,
  marketing_fixed: 300,
  packaging_cost: 5,
  avg_freight_cost: 25,
  tax_regime: 'mei',
  origin_state: 'SP',
  origin_cep: '01310100',
  payment_gateway: {
    provider: 'other',
    fee_percentage: 0.0399,
    fee_fixed: 0.50,
    pix_fee_percentage: 0.0099,
    pix_fee_fixed: 0,
    boleto_fee_fixed: 3.49,
    installment_fee_per_installment: 0.0199,
    max_installments: 12
  },
  cost_structure: {
    devolution_rate: 0.03,
    reprocessing_cost: 10,
    loss_rate: 0.05,
    storage_rate: 0.02,
    weight_surcharge_threshold_g: 1000,
    weight_surcharge_amount: 5
  }
};
