import { supabase } from '../utils/supabase';
import { TaxCalculationService, taxService } from './tax.service';
import {
  BrazilianTaxRegime,
  CostStructureConfig,
  PaymentGatewayConfig,
  CostBreakdown,
  PriceBreakdown,
  OrderEconomics,
  PricingScenarioInput,
  DEFAULT_COST_STRUCTURE,
  DEFAULT_GATEWAY_CONFIG,
  MEI_DAS_COMMERCE,
  BrazilianState
} from '../types/pricing.types';
import { ProductVariant, Product, Asset, GlobalFinancialSettings, UserMode } from '../types';

interface PricingConfig {
  costStructure: CostStructureConfig;
  gateway: PaymentGatewayConfig;
  financialSettings: GlobalFinancialSettings;
  taxRegime: BrazilianTaxRegime;
  originState: BrazilianState;
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

/**
 * Serviço responsável pelo cálculo de preços de produtos e análise econômica de pedidos.
 * 
 * Este serviço calcula preços sugeridos baseados em:
 * - Custo de produção e assets (embalagens)
 * - Estrutura de custos fixos (infraestrutura, marketing, etc.)
 * - Impostos brasileiros (ICMS, DAS, PIS, COFINS)
 * - Taxas de gateway de pagamento
 * - Margem de lucro desejada
 * 
 * Também fornece análise econômica de pedidos, calculando COGS, margem líquida e lucro.
 * 
 * @example
 * ```ts
 * const service = new PricingService();
 * const breakdown = await service.calculateSuggestedPrice({
 *   variant: productVariant,
 *   assets: productAssets,
 *   scenario: pricingScenario,
 *   config: pricingConfig
 * });
 * ```
 */
export class PricingService {
  private taxService: TaxCalculationService;
  private costStructureCache: CostStructureConfig | null = null;
  private gatewayConfigCache: PaymentGatewayConfig | null = null;
  private cacheLoadedAt: number = 0;
  private readonly CACHE_TTL_MS = 300000;

  /**
   * Cria uma instância do PricingService.
   * 
   * @param taxSvc - Serviço de cálculo de impostos (opcional, usa instância padrão se não fornecido)
   */
  constructor(taxSvc?: TaxCalculationService) {
    this.taxService = taxSvc ?? taxService;
  }

  /**
   * Calcula o preço sugerido para uma variante de produto baseado em custos, impostos e margem desejada.
   * 
   * O cálculo considera:
   * - Custo base (produção + assets + custos fixos alocados)
   * - Impostos (ICMS, DAS, PIS, COFINS)
   * - Taxas de gateway de pagamento
   * - Comissões (marketplace, etc.)
   * - Margem de lucro alvo
   * 
   * @param input - Dados da variante, assets, cenário de precificação e configuração
   * @returns Breakdown completo do preço com todos os componentes
   * 
   * @example
   * ```ts
   * const breakdown = await pricingService.calculateSuggestedPrice({
   *   variant: { cost_price: 50, weight_g: 500, ... },
   *   assets: [{ cost_price: 5, ... }],
   *   scenario: { targetMarginPercent: 30, commissionPercent: 10, ... },
   *   config: { costStructure, gateway, financialSettings, ... }
   * });
   * ```
   */
  async calculateSuggestedPrice(input: VariantPricingInput): Promise<PriceBreakdown> {
    const { variant, assets, scenario, config } = input;

    const costBreakdown = this.calculateCostBreakdown(variant, assets, config);
    const estimatedPrice = this.estimateInitialPrice(costBreakdown.totalBaseCost, scenario.targetMarginPercent);

    const taxes = await this.taxService.calculateTaxes({
      revenue: estimatedPrice,
      regime: config.taxRegime,
      originState: config.originState,
      destinationState: scenario.regionUf as BrazilianState,
      monthlyRevenue: config.financialSettings.monthly_sales_vol * (config.financialSettings.avg_freight_cost + 50)
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

  /**
   * Calcula o breakdown detalhado de custos para uma variante de produto.
   * 
   * Inclui:
   * - Custo de produção
   * - Custo de assets (embalagens)
   * - Alocação de custos fixos
   * - Custo de devolução
   * - Custo de armazenamento
   * - Custo de perda
   * - Custo de frete
   * - Custo de marketing
   * 
   * @param variant - Variante do produto
   * @param assets - Lista de assets (embalagens) disponíveis
   * @param config - Configuração de precificação
   * @returns Breakdown detalhado de todos os custos
   */
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

  /**
   * Calcula a taxa do gateway de pagamento baseado no método e número de parcelas.
   * 
   * @param amount - Valor da transação
   * @param gateway - Configuração do gateway de pagamento
   * @param method - Método de pagamento (credit_card, pix, boleto)
   * @param installments - Número de parcelas (apenas para cartão de crédito, padrão: 1)
   * @returns Taxa total do gateway
   */
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

  /**
   * Calcula a análise econômica completa de um pedido.
   * 
   * Calcula:
   * - Revenue (receita total)
   * - COGS (custo dos produtos vendidos)
   * - Custos variáveis (frete, gateway, impostos)
   * - Lucro líquido
   * - Margem percentual
   * 
   * @param input - Dados do pedido, produtos, assets e configuração
   * @returns Análise econômica completa do pedido
   */
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

  /**
   * Calcula o preço de atacado baseado no custo e margem desejada.
   * 
   * @param costPrice - Custo do produto
   * @param marginPercent - Margem de lucro desejada em percentual (padrão: 20%)
   * @returns Preço de atacado calculado
   */
  calculateWholesalePrice(costPrice: number, marginPercent: number = 20): number {
    return costPrice * (1 + marginPercent / 100);
  }

  /**
   * Calcula o preço de varejo para uma variante baseado no modo do usuário.
   * 
   * - Modo ATACADO: calcula preço de atacado baseado no custo
   * - Modo VAREJO: usa preço de varejo da variante, adicionando custo de frete se necessário
   * 
   * @param variant - Variante do produto
   * @param userMode - Modo do usuário (VAREJO ou ATACADO)
   * @param product - Produto completo (opcional, usado para verificar frete grátis)
   * @returns Preço calculado para o modo do usuário
   */
  calculateRetailPrice(
    variant: ProductVariant,
    userMode: UserMode,
    _product?: Product
  ): number {
    if (userMode === UserMode.ATACADO) {
      return variant.wholesale_price ?? 0;
    }

    return variant.retail_price;
  }

  /**
   * Carrega a configuração de estrutura de custos do banco de dados.
   * 
   * Usa cache com TTL de 5 minutos para evitar consultas excessivas.
   * Retorna configuração padrão se não encontrar no banco.
   * 
   * @returns Configuração de estrutura de custos
   */
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

  /**
   * Carrega a configuração do gateway de pagamento do banco de dados.
   * 
   * Usa cache com TTL de 5 minutos para evitar consultas excessivas.
   * Retorna configuração padrão se não encontrar no banco.
   * 
   * @returns Configuração do gateway de pagamento
   */
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

  /**
   * Constrói uma configuração completa de precificação a partir das configurações financeiras.
   * 
   * Carrega estrutura de custos e gateway do banco e combina com as configurações financeiras.
   * 
   * @param financialSettings - Configurações financeiras globais da loja
   * @returns Configuração completa de precificação
   */
  async buildPricingConfig(financialSettings: GlobalFinancialSettings): Promise<PricingConfig> {
    const costStructure = await this.loadCostStructure();
    const gateway = await this.loadGatewayConfig();

    return {
      costStructure,
      gateway,
      financialSettings,
      taxRegime: 'mei',
      originState: 'SP'
    };
  }

  /**
   * Formata um valor numérico como moeda brasileira (BRL).
   * 
   * @param value - Valor numérico a ser formatado
   * @returns String formatada como moeda (ex: "R$ 1.234,56")
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}

export const pricingService = new PricingService();
