import type { TaxDataProvider } from '../tax-data-provider.js';
import type { BrazilianTaxRegime, TaxComputationInput, TaxLine } from '../types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 0;
  return Math.max(0, Math.min(rate, 1));
}

export class IcmsModule {
  constructor(private provider: TaxDataProvider) {}

  async compute(input: TaxComputationInput): Promise<TaxLine[]> {
    if (input.productType !== 'goods') return [];

    const icmsRate = await this.provider.getIcmsRate(input.originState, input.destinationState);

    const isSameState = input.originState === input.destinationState;
    const rate = clampRate(isSameState ? icmsRate.rateInternal : icmsRate.rateInterstate);
    const base = input.revenue;
    const amount = round2(base * rate);

    const lines: TaxLine[] = [];

    const shouldCountSeparatelyForRegime: Record<BrazilianTaxRegime, boolean> = {
      mei: false,
      simples: false,
      presumido: true,
      real: true,
    };

    if (shouldCountSeparatelyForRegime[input.regime]) {
      lines.push({
        code: 'ICMS',
        base,
        rate,
        amount,
        meta: {
          originState: input.originState,
          destinationState: input.destinationState,
        },
      });
    }

    return lines;
  }
}
