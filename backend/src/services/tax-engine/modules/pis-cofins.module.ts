import type { BrazilianTaxRegime, TaxComputationInput, TaxLine } from '../types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class PisCofinsModule {
  async compute(input: TaxComputationInput): Promise<TaxLine[]> {
    if (input.productType !== 'goods') return [];

    const base = input.revenue;

    const ratesByRegime: Record<BrazilianTaxRegime, { pis: number; cofins: number }> = {
      mei: { pis: 0, cofins: 0 },
      simples: { pis: 0, cofins: 0 },
      presumido: { pis: 0.0065, cofins: 0.03 },
      real: { pis: 0.0165, cofins: 0.076 },
    };

    const rates = ratesByRegime[input.regime];
    const pisAmount = round2(base * rates.pis);
    const cofinsAmount = round2(base * rates.cofins);

    const lines: TaxLine[] = [];
    if (pisAmount > 0) lines.push({ code: 'PIS', base, rate: rates.pis, amount: pisAmount });
    if (cofinsAmount > 0) lines.push({ code: 'COFINS', base, rate: rates.cofins, amount: cofinsAmount });
    return lines;
  }
}

