import type { TaxDataProvider } from '../tax-data-provider.js';
import type { TaxComputationInput, TaxLine } from '../types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 0;
  return Math.max(0, Math.min(rate, 1));
}

export class StModule {
  constructor(private provider: TaxDataProvider) {}

  async compute(input: TaxComputationInput): Promise<TaxLine[]> {
    if (!input.applySt) return [];
    if (input.productType !== 'goods') return [];
    if (!input.ncm) return [];

    const stRule = await this.provider.getStRule({
      destinationState: input.destinationState,
      ncm: input.ncm,
      cest: input.cest ?? null,
      originState: input.originState,
    });
    if (!stRule) return [];

    const base = input.revenue;
    const mva = Math.max(0, Number(stRule.mva));
    const internalRate = clampRate(stRule.internalRate);
    const interstateRate = clampRate(stRule.interstateRate ?? 0);

    const stBase = base * (1 + mva);
    const dueInternal = stBase * internalRate;
    const creditInterstate = base * interstateRate;
    const stAmount = round2(Math.max(0, dueInternal - creditInterstate));

    const fcpRate = clampRate(stRule.fcpRate ?? 0);
    const fcpAmount = round2(stBase * fcpRate);

    const lines: TaxLine[] = [];
    if (stAmount > 0) {
      lines.push({
        code: 'ICMS',
        base: stBase,
        rate: internalRate,
        amount: stAmount,
        meta: {
          st: true,
          mva,
          internalRate,
          interstateRate,
          ncm: stRule.ncm,
          cest: stRule.cest,
        },
      });
    }

    if (fcpAmount > 0) {
      lines.push({ code: 'FCP', base: stBase, rate: fcpRate, amount: fcpAmount, meta: { st: true } });
    }

    return lines;
  }
}

