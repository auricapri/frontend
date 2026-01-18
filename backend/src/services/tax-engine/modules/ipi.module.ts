import type { TaxDataProvider } from '../tax-data-provider.js';
import type { TaxComputationInput, TaxLine } from '../types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 0;
  return Math.max(0, Math.min(rate, 1));
}

export class IpiModule {
  constructor(private provider: TaxDataProvider) {}

  async compute(input: TaxComputationInput): Promise<TaxLine[]> {
    if (input.productType !== 'goods') return [];
    if (!input.ncm) return [];

    const rateRow = await this.provider.getIpiRateByNcm(input.ncm);
    if (!rateRow) return [];

    const rate = clampRate(rateRow.rate);
    const base = input.revenue;
    const amount = round2(base * rate);

    if (amount <= 0) return [];

    return [
      {
        code: 'IPI',
        base,
        rate,
        amount,
        meta: { ncm: rateRow.ncm },
      },
    ];
  }
}

