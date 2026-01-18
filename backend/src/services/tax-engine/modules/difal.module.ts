import type { TaxDataProvider } from '../tax-data-provider.js';
import type { TaxComputationInput, TaxLine } from '../types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 0;
  return Math.max(0, Math.min(rate, 1));
}

export class DifalModule {
  constructor(private provider: TaxDataProvider) {}

  async compute(input: TaxComputationInput): Promise<TaxLine[]> {
    if (!input.applyDifal) return [];
    if (input.productType !== 'goods') return [];
    if (input.originState === input.destinationState) return [];
    if (!input.consumerFinalNonContributor) return [];

    const icmsRate = await this.provider.getIcmsRate(input.originState, input.destinationState);
    if (!icmsRate.difalApplicable) return [];

    const base = input.revenue;
    const internal = clampRate(icmsRate.rateInternal);
    const interstate = clampRate(icmsRate.rateInterstate);

    const difalRate = Math.max(0, internal - interstate);
    const difalAmount = round2(base * difalRate);

    const fcpRate = clampRate(0);
    const fcpAmount = round2(base * fcpRate);

    const lines: TaxLine[] = [];
    if (difalAmount > 0) {
      lines.push({
        code: 'DIFAL',
        base,
        rate: difalRate,
        amount: difalAmount,
        meta: {
          originState: input.originState,
          destinationState: input.destinationState,
          internalRate: internal,
          interstateRate: interstate,
        },
      });
    }

    if (fcpAmount > 0) {
      lines.push({
        code: 'FCP',
        base,
        rate: fcpRate,
        amount: fcpAmount,
      });
    }

    return lines;
  }
}

