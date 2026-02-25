import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';
import {
  BrazilianTaxRegime,
  TaxBreakdown,
  ICMSRate,
  MEI_DAS_COMMERCE,
  MEI_MONTHLY_LIMIT,
  BrazilianState
} from '../types/pricing.types';

interface TaxCalculationInput {
  revenue: number;
  regime: BrazilianTaxRegime;
  originState: BrazilianState;
  destinationState: BrazilianState;
  monthlyRevenue?: number;
}

/**
 * Serviço responsável pelo cálculo de impostos brasileiros.
 * 
 * Calcula impostos baseado no regime tributário (MEI, Simples, Presumido, Real)
 * e inclui: DAS, ICMS, PIS, COFINS, IRPJ, CSLL.
 * 
 * Usa cache para taxas de ICMS com TTL de 1 hora.
 * 
 * @example
 * ```ts
 * const service = new TaxCalculationService();
 * const breakdown = await service.calculateTaxes({
 *   revenue: 1000,
 *   regime: 'mei',
 *   originState: 'SP',
 *   destinationState: 'RJ',
 *   monthlyRevenue: 5000
 * });
 * ```
 */
export class TaxCalculationService {
  private icmsRatesCache: Map<string, ICMSRate> = new Map();
  private cacheLoadedAt: number = 0;
  private readonly CACHE_TTL_MS = 3600000;

  /**
   * Calcula todos os impostos aplicáveis baseado no regime tributário.
   * 
   * @param input - Dados para cálculo (receita, regime, estados, receita mensal)
   * @returns Breakdown completo de impostos
   */
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

  private getSimplesAnnexIRate(annualRevenue: number): number {
    if (annualRevenue <= 180000) return 0.04;
    if (annualRevenue <= 360000) return 0.073;
    if (annualRevenue <= 720000) return 0.095;
    if (annualRevenue <= 1800000) return 0.107;
    if (annualRevenue <= 3600000) return 0.143;
    return 0.19;
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

  /**
   * Busca a taxa de ICMS entre dois estados.
   * 
   * Usa cache e carrega do banco se necessário. Retorna taxa padrão se não encontrar.
   * 
   * @param originState - Estado de origem
   * @param destinationState - Estado de destino
   * @returns Taxa de ICMS (interna ou interestadual)
   */
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
        logger.error('Error loading ICMS rates', error);
        return;
      }

      this.icmsRatesCache.clear();
      data?.forEach((row: Record<string, unknown>) => {
        const rate: ICMSRate = {
          originState: row.origin_state as string,
          destinationState: row.destination_state as string,
          rateInternal: Number(row.rate_internal),
          rateInterstate: Number(row.rate_interstate),
          difalApplicable: Boolean(row.difal_applicable),
        };
        this.icmsRatesCache.set(`${rate.originState}-${rate.destinationState}`, rate);
      });

      this.cacheLoadedAt = Date.now();
    } catch (err) {
      logger.error('Failed to load ICMS rates', err);
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

  /**
   * Calcula o DAS proporcional para um pedido no regime MEI.
   * 
   * @param orderRevenue - Receita do pedido
   * @param monthlyRevenue - Receita mensal estimada
   * @param dasFixed - Valor fixo do DAS (padrão: MEI_DAS_COMMERCE)
   * @returns DAS proporcional calculado
   */
  calculateDASProportional(
    orderRevenue: number,
    monthlyRevenue: number,
    dasFixed: number = MEI_DAS_COMMERCE
  ): number {
    if (monthlyRevenue <= 0) return 0;
    return (orderRevenue / monthlyRevenue) * dasFixed;
  }

  /**
   * Verifica se a receita mensal está dentro do limite do MEI.
   * 
   * @param monthlyRevenue - Receita mensal
   * @returns true se está dentro do limite
   */
  isWithinMEILimit(monthlyRevenue: number): boolean {
    return monthlyRevenue <= MEI_MONTHLY_LIMIT;
  }

  /**
   * Retorna o limite anual do MEI.
   * 
   * @returns Limite anual em reais
   */
  getAnnualMEILimit(): number {
    return MEI_MONTHLY_LIMIT * 12;
  }
}

export const taxService = new TaxCalculationService();
