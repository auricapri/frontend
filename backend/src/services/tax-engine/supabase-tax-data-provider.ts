import { supabase } from '../../config/supabase.js';
import logger from '../../config/logger.js';
import { TaxDataRepository } from '../../repositories/tax-data.repository.js';
import type { TaxDataProvider } from './tax-data-provider.js';
import type { BrazilianState, IcmsRate, IpiRate, IssRate, StRule } from './types.js';

function normalizeNcm(ncm: string): string {
  return ncm.replace(/\D/g, '').slice(0, 8);
}

function normalizeCest(cest: string): string {
  return cest.replace(/\D/g, '').slice(0, 7);
}

export class SupabaseTaxDataProvider implements TaxDataProvider {
  private repo = new TaxDataRepository();
  private icmsMemCache = new Map<string, { value: IcmsRate; expiresAt: number }>();
  private ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  async getDataVersion(name: string): Promise<string | null> {
    return await this.repo.getVersion(name);
  }

  async getIcmsRate(originState: BrazilianState, destinationState: BrazilianState): Promise<IcmsRate> {
    const key = `${originState}-${destinationState}`;
    const now = Date.now();
    const cached = this.icmsMemCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const snapshot = await this.repo.getCache<{ version: string; rates: Array<Record<string, unknown>> }>('snapshot:icms_rates');
    if (snapshot?.payload?.rates?.length) {
      const match = snapshot.payload.rates.find(r => r.origin_state === originState && r.destination_state === destinationState) as unknown as {
        origin_state: string;
        destination_state: string;
        rate_internal: number;
        rate_interstate: number;
        difal_applicable: boolean;
      } | undefined;

      if (match) {
        const value: IcmsRate = {
          originState,
          destinationState,
          rateInternal: Number(match.rate_internal),
          rateInterstate: Number(match.rate_interstate),
          difalApplicable: Boolean(match.difal_applicable),
        };
        this.icmsMemCache.set(key, { value, expiresAt: now + this.ttlMs });
        return value;
      }
    }

    const { data, error } = await supabase
      .from('icms_rates')
      .select('origin_state, destination_state, rate_internal, rate_interstate, difal_applicable')
      .eq('origin_state', originState)
      .eq('destination_state', destinationState)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn('Failed to fetch ICMS rate from DB, using fallback', { originState, destinationState, error });
      const fallback = this.getDefaultIcmsRate(originState, destinationState);
      this.icmsMemCache.set(key, { value: fallback, expiresAt: now + this.ttlMs });
      return fallback;
    }

    if (!data) {
      const fallback = this.getDefaultIcmsRate(originState, destinationState);
      this.icmsMemCache.set(key, { value: fallback, expiresAt: now + this.ttlMs });
      return fallback;
    }

    const value: IcmsRate = {
      originState,
      destinationState,
      rateInternal: Number(data.rate_internal),
      rateInterstate: Number(data.rate_interstate),
      difalApplicable: Boolean(data.difal_applicable),
    };
    this.icmsMemCache.set(key, { value, expiresAt: now + this.ttlMs });
    return value;
  }

  async getIpiRateByNcm(ncm: string): Promise<IpiRate | null> {
    const normalized = normalizeNcm(ncm);
    if (normalized.length !== 8) return null;

    const { data, error } = await supabase
      .from('tax_ipi_rates')
      .select('ncm, rate, is_active, valid_from, valid_to')
      .eq('ncm', normalized)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn('Failed to fetch IPI rate', { ncm: normalized, error });
      return null;
    }
    if (!data) return null;

    return {
      ncm: data.ncm,
      rate: Number(data.rate),
      isActive: Boolean(data.is_active),
      validFrom: (data.valid_from ?? null) as string | null,
      validTo: (data.valid_to ?? null) as string | null,
    };
  }

  async getIssRate(cityIbge: string, serviceCode?: string): Promise<IssRate | null> {
    const query = supabase
      .from('tax_iss_rates')
      .select('city_ibge, service_code, rate, is_active')
      .eq('city_ibge', cityIbge)
      .eq('is_active', true)
      .limit(1);

    const { data, error } = serviceCode
      ? await query.eq('service_code', serviceCode).maybeSingle()
      : await query.is('service_code', null).maybeSingle();

    if (error) {
      logger.warn('Failed to fetch ISS rate', { cityIbge, serviceCode, error });
      return null;
    }
    if (!data) return null;

    return {
      cityIbge: data.city_ibge,
      serviceCode: (data.service_code ?? null) as string | null,
      rate: Number(data.rate),
      isActive: Boolean(data.is_active),
    };
  }

  async getStRule(params: { destinationState: BrazilianState; ncm: string; cest?: string | null; originState?: BrazilianState | null }): Promise<StRule | null> {
    const normalizedNcm = normalizeNcm(params.ncm);
    const normalizedCest = params.cest ? normalizeCest(params.cest) : null;
    if (normalizedNcm.length !== 8) return null;

    let query = supabase
      .from('tax_st_rules')
      .select('origin_state, destination_state, ncm, cest, mva, internal_rate, interstate_rate, fcp_rate, is_active, valid_from, valid_to')
      .eq('destination_state', params.destinationState)
      .eq('ncm', normalizedNcm)
      .eq('is_active', true);

    if (normalizedCest) query = query.eq('cest', normalizedCest);
    if (params.originState) query = query.eq('origin_state', params.originState);

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      logger.warn('Failed to fetch ST rule', { params, error });
      return null;
    }
    if (!data) return null;

    return {
      originState: (data.origin_state ?? null) as BrazilianState | null,
      destinationState: data.destination_state as BrazilianState,
      ncm: data.ncm,
      cest: (data.cest ?? null) as string | null,
      mva: Number(data.mva),
      internalRate: Number(data.internal_rate),
      interstateRate: (data.interstate_rate ?? null) as number | null,
      fcpRate: (data.fcp_rate ?? null) as number | null,
      isActive: Boolean(data.is_active),
      validFrom: (data.valid_from ?? null) as string | null,
      validTo: (data.valid_to ?? null) as string | null,
    };
  }

  private getDefaultIcmsRate(originState: BrazilianState, destinationState: BrazilianState): IcmsRate {
    const isSameState = originState === destinationState;
    const isSouthSoutheast = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'].includes(destinationState);

    return {
      originState,
      destinationState,
      rateInternal: 0.18,
      rateInterstate: isSameState ? 0.18 : (isSouthSoutheast ? 0.12 : 0.07),
      difalApplicable: !isSameState,
    };
  }
}

