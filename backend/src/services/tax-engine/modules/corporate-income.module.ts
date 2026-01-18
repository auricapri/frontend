import type { BrazilianTaxRegime, TaxComputationInput, TaxLine } from '../types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class CorporateIncomeModule {
  async compute(input: TaxComputationInput): Promise<TaxLine[]> {
    if (input.productType !== 'goods') return [];
    if (input.regime !== 'presumido' && input.regime !== 'real') return [];

    const baseRevenue = input.revenue;

    const presumedProfitRateByRegime: Record<Extract<BrazilianTaxRegime, 'presumido' | 'real'>, number> = {
      presumido: 0.08,
      real: 0.15,
    };

    const profitBase = baseRevenue * presumedProfitRateByRegime[input.regime];
    const irpj = round2(profitBase * 0.15);
    const csll = round2(profitBase * 0.09);

    const lines: TaxLine[] = [];
    if (irpj > 0) lines.push({ code: 'IRPJ', base: profitBase, rate: 0.15, amount: irpj, meta: { profitBaseRate: presumedProfitRateByRegime[input.regime] } });
    if (csll > 0) lines.push({ code: 'CSLL', base: profitBase, rate: 0.09, amount: csll, meta: { profitBaseRate: presumedProfitRateByRegime[input.regime] } });

    return lines;
  }
}

