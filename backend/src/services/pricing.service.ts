import { supabase } from '../config/supabase.js';
import { TaxCalculationService } from './tax.service.js';
import { ProductsRepository } from '../repositories/products.repository.js';
import { AssetsRepository } from '../repositories/assets.repository.js';
import type { ProductVariant, Product, Asset, GlobalFinancialSettings } from '../../shared/types/index.js';

interface CostStructureConfig {
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

interface PaymentGatewayConfig {
  id?: string;
  provider: string;
  isActive: boolean;
  feePercentage: number;
  feeFixed: number;
  pixFeePercentage: number;
  pixFeeFixed: number;
  boletoFeeFixed: number;
  installmentFeePercentPerInstallment: number;
  maxInstallments: number;
}

interface PricingConfig {
  costStructure: CostStructureConfig;
  gateway: PaymentGatewayConfig;
  financialSettings: GlobalFinancialSettings;
  taxRegime: 'mei' | 'simples' | 'presumido' | 'real';
  originState: string;
}

interface CostBreakdown {
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

interface TaxBreakdown {
  regime: string;
  dasProportional: number;
  icms: number;
  pis: number;
  cofins: number;
  ipiIfApplicable: number;
  totalTaxAmount: number;
  effectiveTaxRate: number;
}

interface TaxBreakdownV2 {
  regime: string;
  lines: Array<{
    code: string;
    base: number;
    rate: number;
    amount: number;
    meta?: Record<string, unknown>;
  }>;
  totalTaxAmount: number;
  effectiveTaxRate: number;
}

interface PriceBreakdown {
  baseCost: CostBreakdown;
  taxes: TaxBreakdown | TaxBreakdownV2;
  gatewayFee: number;
  targetMargin: number;
  targetMarginAmount: number;
  suggestedPrice: number;
  finalPrice: number;
}

interface PricingScenarioInput {
  channel: 'ecommerce' | 'marketplace' | 'wholesale';
  regionUf: string;
  targetMarginPercent: number;
  commissionPercent: number;
  adsCacTarget: number;
}

interface VariantPricingInput {
  variant: ProductVariant;
  assets: Asset[];
  scenario: PricingScenarioInput;
  config: PricingConfig;
}

interface OrderItem {
  product_id: string;
  variant_id?: string;
  price: number;
  quantity: number;
}

interface OrderEconomicsInput {
  items: OrderItem[];
  total: number;
  products: Product[];
  assets: Asset[];
  freightRealCost: number;
  paymentMethod: 'credit_card' | 'pix';
  config: PricingConfig;
}

interface OrderEconomics {
  revenue: number;
  cogs: number;
  freightReal: number;
  gatewayFee: number;
  dasProportional: number;
  totalVariableCosts: number;
  netProfit: number;
  marginPercent: number;
}

const DEFAULT_COST_STRUCTURE: CostStructureConfig = {
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

const DEFAULT_GATEWAY_CONFIG: PaymentGatewayConfig = {
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

const MEI_DAS_COMMERCE = 71.60;

export class PricingService {
  private taxService: TaxCalculationService;
  private productsRepo: ProductsRepository;
  private assetsRepo: AssetsRepository;
  private costStructureCache: CostStructureConfig | null = null;
  private gatewayConfigCache: PaymentGatewayConfig | null = null;
  private cacheLoadedAt: number = 0;
  private readonly CACHE_TTL_MS = 300000;

  constructor() {
    this.taxService = new TaxCalculationService();
    this.productsRepo = new ProductsRepository();
    this.assetsRepo = new AssetsRepository();
  }

  async calculateSuggestedPrice(input: VariantPricingInput): Promise<PriceBreakdown> {
    const { variant, assets, scenario, config } = input;

    const costBreakdown = this.calculateCostBreakdown(variant, assets, config);
    const estimatedPrice = this.estimateInitialPrice(costBreakdown.totalBaseCost, scenario.targetMarginPercent);

    const monthlyRevenueEstimate =
      config.financialSettings.monthly_sales_vol * (config.financialSettings.avg_freight_cost + 50);

    const shouldUseV2 = process.env.PRICING_TAX_ENGINE_V2 === 'true';

    const taxes = shouldUseV2
      ? await this.taxService.calculateTaxesV2({
          revenue: estimatedPrice,
          regime: config.taxRegime as any,
          originState: config.originState as any,
          destinationState: scenario.regionUf as any,
          monthlyRevenue: monthlyRevenueEstimate,
          annualRevenue: monthlyRevenueEstimate * 12,
          ncm: (variant as any).ncm,
          cest: (variant as any).cest,
          productType: 'goods',
          applySt: true,
          applyDifal: true,
          consumerFinalNonContributor: true,
        })
      : await this.taxService.calculateTaxes({
          revenue: estimatedPrice,
          regime: config.taxRegime as any,
          originState: config.originState as any,
          destinationState: scenario.regionUf as any,
          monthlyRevenue: monthlyRevenueEstimate,
        });

    const targetMarginDecimal = scenario.targetMarginPercent / 100;
    const gatewayRateDecimal = config.gateway.feePercentage;
    const commissionDecimal = scenario.commissionPercent / 100;

    let taxRateForFormula = 0;
    if (config.taxRegime !== 'mei') {
      taxRateForFormula = taxes.effectiveTaxRate;
    }

    const divisor = 1 - targetMarginDecimal - gatewayRateDecimal - commissionDecimal - taxRateForFormula;

    let suggestedPrice = 0;
    if (divisor > 0.1) {
      suggestedPrice = costBreakdown.totalBaseCost / divisor;
    } else {
      suggestedPrice = costBreakdown.totalBaseCost * 2.5;
    }

    const fixedGatewayFee = config.gateway.feeFixed;
    suggestedPrice += fixedGatewayFee / divisor;

    const finalPrice = Math.ceil(suggestedPrice * 100) / 100;

    const targetMarginAmount = finalPrice * targetMarginDecimal;

    return {
      baseCost: costBreakdown,
      taxes,
      gatewayFee: this.calculateGatewayFee(finalPrice, config.gateway, 'credit_card'),
      targetMargin: scenario.targetMarginPercent,
      targetMarginAmount,
      suggestedPrice,
      finalPrice
    };
  }

  calculateCostBreakdown(
    variant: ProductVariant,
    assets: Asset[],
    config: PricingConfig
  ): CostBreakdown {
    const productionCost = variant.cost_price ?? 0;

    let assetsCost = 0;
    if (variant.correlated_assets && variant.correlated_assets.length > 0) {
      variant.correlated_assets.forEach(link => {
        const asset = assets.find(a => a.id === link.asset_id);
        if (asset) {
          assetsCost += asset.cost_price * link.quantity_required;
        }
      });
    } else {
      assetsCost = config.costStructure.defaultPackagingCost;
    }

    const { financialSettings, costStructure } = config;
    const totalFixed = financialSettings.fixed_monthly + financialSettings.infra_tech + financialSettings.das_mei;
    const fixedCostAllocation = totalFixed / Math.max(financialSettings.monthly_sales_vol, 1);

    const weightG = variant.weight_g ?? 0;
    let freightCost = financialSettings.avg_freight_cost;
    if (weightG > costStructure.weightSurchargeThresholdG) {
      freightCost += costStructure.weightSurchargeAmount;
    }

    const devolutionCost = costStructure.devolutionRate * (
      freightCost * 2 + 
      costStructure.reprocessingCost + 
      productionCost * costStructure.lossRate
    );

    const storageCost = productionCost * costStructure.storageRate;
    const lossCost = productionCost * costStructure.lossRate;
    const marketingCost = financialSettings.marketing_fixed / Math.max(financialSettings.monthly_sales_vol, 1);

    const totalBaseCost = 
      productionCost + 
      assetsCost + 
      fixedCostAllocation + 
      devolutionCost + 
      storageCost + 
      lossCost +
      freightCost + 
      marketingCost;

    return {
      productionCost,
      assetsCost,
      fixedCostAllocation,
      devolutionCost,
      storageCost,
      lossCost,
      freightCost,
      marketingCost,
      totalBaseCost
    };
  }

  private estimateInitialPrice(baseCost: number, targetMarginPercent: number): number {
    const marginDecimal = targetMarginPercent / 100;
    return baseCost / (1 - marginDecimal - 0.05);
  }

  calculateGatewayFee(
    amount: number,
    gateway: PaymentGatewayConfig,
    method: 'credit_card' | 'pix' | 'boleto',
    installments: number = 1
  ): number {
    switch (method) {
      case 'pix':
        return amount * gateway.pixFeePercentage + gateway.pixFeeFixed;
      case 'boleto':
        return gateway.boletoFeeFixed;
      case 'credit_card':
      default:
        {
          let fee = amount * gateway.feePercentage + gateway.feeFixed;
          if (installments > 1) {
            fee += amount * gateway.installmentFeePercentPerInstallment * (installments - 1);
          }
          return fee;
        }
    }
  }

  async calculateOrderEconomics(input: OrderEconomicsInput): Promise<OrderEconomics> {
    const { items, total, products, assets, freightRealCost, paymentMethod, config } = input;

    let cogs = 0;
    items.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      const rawId = item.variant_id ?? item.product_id;
      const variantId = rawId.split('_')[0];
      const variant = product?.variants?.find(v => v.id === variantId) ?? product?.variants?.[0];

      if (variant) {
        const unitCost = variant.cost_price ?? (item.price * 0.4);
        let assetCost = 0;
        if (variant.correlated_assets) {
          variant.correlated_assets.forEach(link => {
            const asset = assets.find(a => a.id === link.asset_id);
            if (asset) {
              assetCost += asset.cost_price * link.quantity_required;
            }
          });
        }
        cogs += (unitCost + assetCost) * item.quantity;
      } else {
        cogs += (item.price * 0.4) * item.quantity;
      }
    });

    const gatewayFee = this.calculateGatewayFee(total, config.gateway, paymentMethod);

    let dasProportional = 0;
    if (config.taxRegime === 'mei') {
      const estimatedMonthlyRevenue = config.financialSettings.monthly_sales_vol * 100;
      dasProportional = this.taxService.calculateDASProportional(
        total,
        estimatedMonthlyRevenue,
        MEI_DAS_COMMERCE
      );
    }

    const totalVariableCosts = freightRealCost + gatewayFee + dasProportional;
    const netProfit = total - cogs - totalVariableCosts;
    const marginPercent = total > 0 ? (netProfit / total) * 100 : 0;

    return {
      revenue: total,
      cogs,
      freightReal: freightRealCost,
      gatewayFee,
      dasProportional,
      totalVariableCosts,
      netProfit,
      marginPercent
    };
  }

  async loadCostStructure(): Promise<CostStructureConfig> {
    if (this.costStructureCache && !this.shouldRefreshCache()) {
      return this.costStructureCache;
    }

    try {
      const { data, error } = await supabase
        .from('cost_structure_config')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error || !data) {
        return DEFAULT_COST_STRUCTURE;
      }

      this.costStructureCache = {
        id: data.id,
        name: data.name,
        isActive: data.is_active,
        devolutionRate: Number(data.devolution_rate),
        reprocessingCost: Number(data.reprocessing_cost),
        lossRate: Number(data.loss_rate),
        storageRate: Number(data.storage_rate),
        defaultPackagingCost: Number(data.default_packaging_cost),
        weightSurchargeThresholdG: data.weight_surcharge_threshold_g,
        weightSurchargeAmount: Number(data.weight_surcharge_amount)
      };

      this.cacheLoadedAt = Date.now();
      return this.costStructureCache;
    } catch {
      return DEFAULT_COST_STRUCTURE;
    }
  }

  async loadGatewayConfig(): Promise<PaymentGatewayConfig> {
    if (this.gatewayConfigCache && !this.shouldRefreshCache()) {
      return this.gatewayConfigCache;
    }

    try {
      const { data, error } = await supabase
        .from('payment_gateway_config')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error || !data) {
        return DEFAULT_GATEWAY_CONFIG;
      }

      this.gatewayConfigCache = {
        id: data.id,
        provider: data.provider,
        isActive: data.is_active,
        feePercentage: Number(data.fee_percentage),
        feeFixed: Number(data.fee_fixed),
        pixFeePercentage: Number(data.pix_fee_percentage),
        pixFeeFixed: Number(data.pix_fee_fixed),
        boletoFeeFixed: Number(data.boleto_fee_fixed),
        installmentFeePercentPerInstallment: Number(data.installment_fee_percent_per_installment),
        maxInstallments: data.max_installments
      };

      this.cacheLoadedAt = Date.now();
      return this.gatewayConfigCache;
    } catch {
      return DEFAULT_GATEWAY_CONFIG;
    }
  }

  private shouldRefreshCache(): boolean {
    return Date.now() - this.cacheLoadedAt > this.CACHE_TTL_MS;
  }

  async buildPricingConfig(financialSettings: GlobalFinancialSettings): Promise<PricingConfig> {
    const costStructure = await this.loadCostStructure();
    const gateway = await this.loadGatewayConfig();

    return {
      costStructure,
      gateway,
      financialSettings,
      taxRegime: financialSettings.tax_regime || 'mei',
      originState: financialSettings.origin_state || 'SP'
    };
  }
}
