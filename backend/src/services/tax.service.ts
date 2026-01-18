import { supabase } from '../config/supabase.js';
import { getTaxHistoryService } from './tax-history.service.js';
import logger from '../config/logger.js';

type BrazilianTaxRegime = 'mei' | 'simples' | 'presumido' | 'real';
type BrazilianState = 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' | 'MA' | 'MG' | 'MS' | 'MT' | 'PA' | 'PB' | 'PE' | 'PI' | 'PR' | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO';

interface TaxBreakdown {
  regime: BrazilianTaxRegime;
  dasProportional: number;
  icms: number;
  pis: number;
  cofins: number;
  ipiIfApplicable: number;
  totalTaxAmount: number;
  effectiveTaxRate: number;
}

export interface TaxBreakdownV2 {
  regime: BrazilianTaxRegime;
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

interface ICMSRate {
  originState: BrazilianState;
  destinationState: BrazilianState;
  rateInternal: number;
  rateInterstate: number;
  difalApplicable: boolean;
}

interface TaxCalculationInput {
  revenue: number;
  regime: BrazilianTaxRegime;
  originState: BrazilianState;
  destinationState: BrazilianState;
  monthlyRevenue?: number;
}

const MEI_DAS_COMMERCE = 71.60;
const MEI_MONTHLY_LIMIT = 6750;

export class TaxCalculationService {
  private icmsRatesCache: Map<string, ICMSRate> = new Map();
  private cacheLoadedAt: number = 0;
  private readonly CACHE_TTL_MS = 3600000;

  async calculateTaxes(input: TaxCalculationInput): Promise<TaxBreakdown> {
    const { revenue, regime, originState, destinationState, monthlyRevenue } = input;

    switch (regime) {
      case 'mei':
        return this.calculateMEITaxes(revenue, monthlyRevenue);
      case 'simples':
        return this.calculateSimplesTaxes(revenue, originState, destinationState);
      case 'presumido':
        return this.calculateLucroPresumidoTaxes(revenue, originState, destinationState);
      case 'real':
        return this.calculateLucroRealTaxes(revenue, originState, destinationState);
      default:
        return this.calculateMEITaxes(revenue, monthlyRevenue);
    }
  }

  async calculateTaxesV2(input: TaxCalculationInput & {
    destinationCityIbge?: string;
    ncm?: string;
    cest?: string;
    productType?: 'goods' | 'service';
    applySt?: boolean;
    applyDifal?: boolean;
    consumerFinalNonContributor?: boolean;
    annualRevenue?: number;
    monthlyRevenue?: number;
  }): Promise<TaxBreakdownV2> {
    const { TaxEngineService } = await import('./tax-engine/tax-engine.service.js');
    const { originState, destinationState, revenue, regime } = input;

    const engine = new TaxEngineService();
    const result = await engine.compute({
      revenue,
      regime,
      originState,
      destinationState,
      destinationCityIbge: input.destinationCityIbge,
      ncm: input.ncm,
      cest: input.cest,
      productType: input.productType ?? 'goods',
      applySt: input.applySt ?? false,
      applyDifal: input.applyDifal ?? true,
      consumerFinalNonContributor: input.consumerFinalNonContributor ?? true,
      annualRevenue: input.annualRevenue,
      monthlyRevenue: input.monthlyRevenue,
    });

    const response = {
      regime: result.regime,
      lines: result.lines.map(l => ({
        code: l.code,
        base: l.base,
        rate: l.rate,
        amount: l.amount,
        meta: l.meta,
      })),
      totalTaxAmount: result.totalTaxAmount,
      effectiveTaxRate: result.effectiveTaxRate,
    };

    await getTaxHistoryService().record(
      {
        ...input,
        engine: 'v2',
      },
      response
    );

    return response;
  }

  private calculateMEITaxes(revenue: number, monthlyRevenue?: number): TaxBreakdown {
    const estimatedMonthlyRevenue = monthlyRevenue ?? MEI_MONTHLY_LIMIT;
    const revenueShare = revenue / estimatedMonthlyRevenue;
    const dasProportional = MEI_DAS_COMMERCE * revenueShare;

    return {
      regime: 'mei',
      dasProportional,
      icms: 0,
      pis: 0,
      cofins: 0,
      ipiIfApplicable: 0,
      totalTaxAmount: dasProportional,
      effectiveTaxRate: dasProportional / revenue
    };
  }

  private async calculateSimplesTaxes(
    revenue: number,
    _originState: BrazilianState,
    _destinationState: BrazilianState
  ): Promise<TaxBreakdown> {
    const annexRate = this.getSimplesAnnexIRate(revenue * 12);
    const totalTax = revenue * annexRate;

    return {
      regime: 'simples',
      dasProportional: 0,
      icms: totalTax * 0.34,
      pis: totalTax * 0.038,
      cofins: totalTax * 0.175,
      ipiIfApplicable: 0,
      totalTaxAmount: totalTax,
      effectiveTaxRate: annexRate
    };
  }

  /**
   * Calcula a alíquota efetiva do Simples Nacional (Anexo I - Comércio)
   * Fórmula: (RBT12 × AlíqNom - PD) / RBT12
   * Onde PD = Parcela a Deduzir
   *
   * Tabela Simples Nacional 2024 - Anexo I (Comércio):
   * Faixa 1: até 180k     → 4.00%, PD = 0
   * Faixa 2: até 360k     → 7.30%, PD = 5.940
   * Faixa 3: até 720k     → 9.50%, PD = 13.860
   * Faixa 4: até 1.8M     → 10.70%, PD = 22.500
   * Faixa 5: até 3.6M     → 14.30%, PD = 87.300
   * Faixa 6: até 4.8M     → 19.00%, PD = 378.000
   */
  private getSimplesAnnexIRate(annualRevenue: number): number {
    let nominalRate: number;
    let deduction: number;

    if (annualRevenue <= 180000) {
      nominalRate = 0.04;
      deduction = 0;
    } else if (annualRevenue <= 360000) {
      nominalRate = 0.073;
      deduction = 5940;
    } else if (annualRevenue <= 720000) {
      nominalRate = 0.095;
      deduction = 13860;
    } else if (annualRevenue <= 1800000) {
      nominalRate = 0.107;
      deduction = 22500;
    } else if (annualRevenue <= 3600000) {
      nominalRate = 0.143;
      deduction = 87300;
    } else {
      nominalRate = 0.19;
      deduction = 378000;
    }

    // Alíquota efetiva = (RBT12 × AlíqNom - PD) / RBT12
    const effectiveRate = (annualRevenue * nominalRate - deduction) / annualRevenue;

    // Garantir que não retorne valor negativo (pode acontecer se receita for muito baixa)
    return Math.max(0, effectiveRate);
  }

  private async calculateLucroPresumidoTaxes(
    revenue: number,
    originState: BrazilianState,
    destinationState: BrazilianState
  ): Promise<TaxBreakdown> {
    const presumedProfit = revenue * 0.08;
    const irpj = presumedProfit * 0.15;
    const csll = presumedProfit * 0.09;
    const pis = revenue * 0.0065;
    const cofins = revenue * 0.03;

    const icmsRate = await this.getICMSRate(originState, destinationState);
    const icms = revenue * icmsRate.rateInterstate;

    const totalTax = irpj + csll + pis + cofins + icms;

    return {
      regime: 'presumido',
      dasProportional: 0,
      icms,
      pis,
      cofins,
      ipiIfApplicable: 0,
      totalTaxAmount: totalTax,
      effectiveTaxRate: totalTax / revenue
    };
  }

  private async calculateLucroRealTaxes(
    revenue: number,
    originState: BrazilianState,
    destinationState: BrazilianState
  ): Promise<TaxBreakdown> {
    const estimatedProfit = revenue * 0.15;
    const irpj = estimatedProfit * 0.15;
    const csll = estimatedProfit * 0.09;
    const pis = revenue * 0.0165;
    const cofins = revenue * 0.076;

    const icmsRate = await this.getICMSRate(originState, destinationState);
    const icms = revenue * icmsRate.rateInterstate;

    const totalTax = irpj + csll + pis + cofins + icms;

    return {
      regime: 'real',
      dasProportional: 0,
      icms,
      pis,
      cofins,
      ipiIfApplicable: 0,
      totalTaxAmount: totalTax,
      effectiveTaxRate: totalTax / revenue
    };
  }

  async getICMSRate(originState: BrazilianState, destinationState: BrazilianState): Promise<ICMSRate> {
    const cacheKey = `${originState}-${destinationState}`;

    if (this.shouldRefreshCache()) {
      await this.loadICMSRates();
    }

    const cached = this.icmsRatesCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    return this.getDefaultICMSRate(originState, destinationState);
  }

  private shouldRefreshCache(): boolean {
    return Date.now() - this.cacheLoadedAt > this.CACHE_TTL_MS || this.icmsRatesCache.size === 0;
  }

  private async loadICMSRates(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('icms_rates')
        .select('*');

      if (error) {
        logger.error('Error loading ICMS rates', { error });
        return;
      }

      this.icmsRatesCache.clear();
      data?.forEach(row => {
        const rate: ICMSRate = {
          originState: row.origin_state as BrazilianState,
          destinationState: row.destination_state as BrazilianState,
          rateInternal: Number(row.rate_internal),
          rateInterstate: Number(row.rate_interstate),
          difalApplicable: row.difal_applicable
        };
        this.icmsRatesCache.set(`${rate.originState}-${rate.destinationState}`, rate);
      });

      this.cacheLoadedAt = Date.now();
    } catch (err) {
      logger.error('Failed to load ICMS rates', { error: err });
    }
  }

  private getDefaultICMSRate(originState: BrazilianState, destinationState: BrazilianState): ICMSRate {
    const isSameState = originState === destinationState;
    const isSouthSoutheast = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'].includes(destinationState);

    return {
      originState,
      destinationState,
      rateInternal: 0.18,
      rateInterstate: isSameState ? 0.18 : (isSouthSoutheast ? 0.12 : 0.07),
      difalApplicable: !isSameState
    };
  }

  calculateDASProportional(
    orderRevenue: number,
    monthlyRevenue: number,
    dasFixed: number = MEI_DAS_COMMERCE
  ): number {
    if (monthlyRevenue <= 0) return 0;
    return (orderRevenue / monthlyRevenue) * dasFixed;
  }

  isWithinMEILimit(monthlyRevenue: number): boolean {
    return monthlyRevenue <= MEI_MONTHLY_LIMIT;
  }

  getAnnualMEILimit(): number {
    return MEI_MONTHLY_LIMIT * 12;
  }
}
