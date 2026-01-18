import { env } from '../../config/env.js';
import type { TaxDataProvider } from './tax-data-provider.js';
import type { TaxComputationInput, TaxComputationResult, TaxLine } from './types.js';
import { SupabaseTaxDataProvider } from './supabase-tax-data-provider.js';
import { IcmsModule } from './modules/icms.module.js';
import { DifalModule } from './modules/difal.module.js';
import { IpiModule } from './modules/ipi.module.js';
import { PisCofinsModule } from './modules/pis-cofins.module.js';
import { IssModule } from './modules/iss.module.js';
import { StModule } from './modules/st.module.js';
import { CorporateIncomeModule } from './modules/corporate-income.module.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function sumAmounts(lines: TaxLine[]): number {
  return lines.reduce((acc, line) => acc + (Number.isFinite(line.amount) ? line.amount : 0), 0);
}

export class TaxEngineService {
  private provider: TaxDataProvider;
  private icms: IcmsModule;
  private difal: DifalModule;
  private ipi: IpiModule;
  private pisCofins: PisCofinsModule;
  private iss: IssModule;
  private st: StModule;
  private corporateIncome: CorporateIncomeModule;

  constructor(provider?: TaxDataProvider) {
    this.provider = provider ?? new SupabaseTaxDataProvider(env.tax.cacheTtlMs);
    this.icms = new IcmsModule(this.provider);
    this.difal = new DifalModule(this.provider);
    this.ipi = new IpiModule(this.provider);
    this.pisCofins = new PisCofinsModule();
    this.iss = new IssModule(this.provider);
    this.st = new StModule(this.provider);
    this.corporateIncome = new CorporateIncomeModule();
  }

  async compute(input: TaxComputationInput): Promise<TaxComputationResult> {
    const safeRevenue = Number.isFinite(input.revenue) ? Math.max(0, input.revenue) : 0;
    const normalized: TaxComputationInput = { ...input, revenue: safeRevenue };

    const lines: TaxLine[] = [];

    if (normalized.regime === 'mei') {
      const monthlyRevenue = Math.max(1, 6750);
      const dasFixed = 71.6;
      const dasAmount = round2((normalized.revenue / monthlyRevenue) * dasFixed);
      lines.push({ code: 'DAS', base: normalized.revenue, rate: dasAmount / Math.max(normalized.revenue, 1), amount: dasAmount });
    }

    if (normalized.regime === 'simples') {
      const annualRevenue = Math.max(0, normalized.annualRevenue ?? (normalized.monthlyRevenue ? normalized.monthlyRevenue * 12 : normalized.revenue * 12));
      const annexRate = this.getSimplesAnnexIRate(annualRevenue);
      const dasAmount = round2(normalized.revenue * annexRate);
      lines.push({ code: 'DAS', base: normalized.revenue, rate: annexRate, amount: dasAmount, meta: { annualRevenue } });
    } else {
      lines.push(...(await this.icms.compute(normalized)));
      lines.push(...(await this.difal.compute(normalized)));
      lines.push(...(await this.pisCofins.compute(normalized)));
      lines.push(...(await this.corporateIncome.compute(normalized)));
    }

    lines.push(...(await this.st.compute(normalized)));
    lines.push(...(await this.ipi.compute(normalized)));
    lines.push(...(await this.iss.compute(normalized)));

    const total = round2(sumAmounts(lines));
    const effectiveRate = normalized.revenue > 0 ? total / normalized.revenue : 0;

    return {
      regime: normalized.regime,
      lines,
      totalTaxAmount: total,
      effectiveTaxRate: effectiveRate,
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
}

let taxEngineSingleton: TaxEngineService | null = null;
export function getTaxEngineService(): TaxEngineService {
  if (!taxEngineSingleton) taxEngineSingleton = new TaxEngineService();
  return taxEngineSingleton;
}
