/**
 * Unit tests for checkout utility functions
 *
 * Covers:
 * - formatCurrency (pt-BR, en-US, es, fr)
 * - maskCPF formatting
 * - maskCreditCard formatting
 * - Split card amount calculation (R$100.01 → 50.01 + 50.00)
 * - splitCardsValid tolerance guard
 */

import { describe, it, expect } from 'vitest';

import { formatCurrency } from '../../../src/utils/currency';
import { maskCPF, maskCreditCard } from '../../../src/utils/masks';

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

describe('formatCurrency', () => {
  it('formats BRL correctly for pt locale', () => {
    const result = formatCurrency(100.01, 'pt');
    // Intl.NumberFormat pt-BR may produce "R$\u00a0100,01" — check essential parts
    expect(result).toMatch(/R\$/);
    expect(result).toMatch(/100/);
  });

  it('formats BRL zero correctly', () => {
    const result = formatCurrency(0, 'pt');
    expect(result).toMatch(/R\$/);
    expect(result).toMatch(/0/);
  });

  it('formats USD for en locale', () => {
    const result = formatCurrency(49.99, 'en');
    expect(result).toMatch(/\$/);
    expect(result).toMatch(/49/);
    expect(result).toMatch(/99/);
  });

  it('formats EUR for es locale', () => {
    const result = formatCurrency(200, 'es');
    expect(result).toMatch(/€/);
    expect(result).toMatch(/200/);
  });

  it('formats EUR for fr locale', () => {
    const result = formatCurrency(1234.56, 'fr');
    expect(result).toMatch(/€/);
    expect(result).toMatch(/1/);
  });

  it('formats large values without error', () => {
    const result = formatCurrency(999999.99, 'pt');
    expect(result).toMatch(/R\$/);
    expect(result).toMatch(/999/);
  });

  it('formats negative values (refund scenario)', () => {
    const result = formatCurrency(-50, 'pt');
    expect(result).toMatch(/50/);
  });
});

// ---------------------------------------------------------------------------
// maskCPF
// ---------------------------------------------------------------------------

describe('maskCPF — formatting', () => {
  it('formats 11 raw digits as XXX.XXX.XXX-XX', () => {
    expect(maskCPF('52998224725')).toBe('529.982.247-25');
  });

  it('handles already formatted CPF without double-masking', () => {
    expect(maskCPF('529.982.247-25')).toBe('529.982.247-25');
  });

  it('handles 3-digit partial input', () => {
    expect(maskCPF('123')).toBe('123');
  });

  it('handles 6-digit partial input', () => {
    expect(maskCPF('123456')).toBe('123.456');
  });

  it('handles 9-digit partial input', () => {
    expect(maskCPF('123456789')).toBe('123.456.789');
  });

  it('returns empty string for empty input', () => {
    expect(maskCPF('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// maskCreditCard
// ---------------------------------------------------------------------------

describe('maskCreditCard — formatting', () => {
  it('formats 16 digits as XXXX XXXX XXXX XXXX', () => {
    expect(maskCreditCard('4111111111111111')).toBe('4111 1111 1111 1111');
  });

  it('formats 4-digit partial as-is', () => {
    expect(maskCreditCard('4111')).toBe('4111');
  });

  it('formats 8-digit partial with one space', () => {
    expect(maskCreditCard('41111111')).toBe('4111 1111');
  });

  it('formats 12-digit partial with two spaces', () => {
    expect(maskCreditCard('411111111111')).toBe('4111 1111 1111');
  });

  it('strips hyphens before formatting', () => {
    expect(maskCreditCard('4111-1111-1111-1111')).toBe('4111 1111 1111 1111');
  });

  it('returns empty string for empty input', () => {
    expect(maskCreditCard('')).toBe('');
  });

  it('truncates input longer than 16 digits', () => {
    expect(maskCreditCard('41111111111111119999')).toBe('4111 1111 1111 1111');
  });
});

// ---------------------------------------------------------------------------
// Split card amount logic
// Mirrors useInstallmentState:
//   half = Math.round((total / 2) * 100) / 100
//   card2 = Math.round((total - half) * 100) / 100
// ---------------------------------------------------------------------------

function splitAmount(total: number): { card1: number; card2: number } {
  const half = Math.round((total / 2) * 100) / 100;
  return {
    card1: half,
    card2: Math.round((total - half) * 100) / 100,
  };
}

describe('Split card amount calculation', () => {
  it('R$100.01 splits into card1=50.01 and card2=50.00', () => {
    const { card1, card2 } = splitAmount(100.01);
    expect(card1).toBe(50.01);
    expect(card2).toBe(50.00);
    expect(card1 + card2).toBeCloseTo(100.01, 5);
  });

  it('R$100.00 splits into 50.00 + 50.00', () => {
    const { card1, card2 } = splitAmount(100.00);
    expect(card1).toBe(50.00);
    expect(card2).toBe(50.00);
  });

  it('R$1.00 splits into 0.50 + 0.50', () => {
    const { card1, card2 } = splitAmount(1.00);
    expect(card1).toBe(0.50);
    expect(card2).toBe(0.50);
  });

  it('R$0.01 minimum splits into 0.01 + 0.00 without going negative', () => {
    const { card1, card2 } = splitAmount(0.01);
    expect(card1).toBe(0.01);
    expect(card2).toBe(0.00);
    expect(card1 + card2).toBeCloseTo(0.01, 5);
  });

  it('R$199.99 split sum equals original', () => {
    const { card1, card2 } = splitAmount(199.99);
    expect(card1 + card2).toBeCloseTo(199.99, 5);
  });

  it('R$1000.00 splits evenly', () => {
    const { card1, card2 } = splitAmount(1000.00);
    expect(card1).toBe(500.00);
    expect(card2).toBe(500.00);
  });

  it('R$9999.99 large amount sum stays correct', () => {
    const { card1, card2 } = splitAmount(9999.99);
    expect(card1 + card2).toBeCloseTo(9999.99, 5);
  });
});

// ---------------------------------------------------------------------------
// splitCardsValid — mirrors useInstallmentState useMemo
// difference < 0.01 (1 centavo tolerance using IEEE 754 floating point)
// ---------------------------------------------------------------------------

function splitCardsValid(card1Amount: number, card2Amount: number, finalTotal: number): boolean {
  const difference = Math.abs((card1Amount + card2Amount) - finalTotal);
  return difference < 0.01;
}

describe('splitCardsValid — 1 centavo tolerance', () => {
  it('exact match (50+50=100) is valid', () => {
    expect(splitCardsValid(50.00, 50.00, 100.00)).toBe(true);
  });

  it('split amounts from splitAmount() are always valid', () => {
    // This mirrors the real use case: user splits and amounts come from splitAmount()
    const { card1, card2 } = splitAmount(100.01);
    expect(splitCardsValid(card1, card2, 100.01)).toBe(true);
  });

  it('difference of 0.02 (2 centavos) is invalid', () => {
    // 50.01 + 50.01 = 100.02, difference from 100.00 = 0.02 >= 0.01
    expect(splitCardsValid(50.01, 50.01, 100.00)).toBe(false);
  });

  it('difference of 0.05 is invalid', () => {
    // 50.00 + 49.95 = 99.95, difference from 100.00 = 0.05 >= 0.01
    expect(splitCardsValid(50.00, 49.95, 100.00)).toBe(false);
  });

  it('sum larger than total by 0.10 is invalid', () => {
    expect(splitCardsValid(50.10, 50.00, 100.00)).toBe(false);
  });

  it('zero amounts for zero total is valid', () => {
    expect(splitCardsValid(0, 0, 0)).toBe(true);
  });

  it('amounts summing to nearly the total (within 0.009) are valid', () => {
    // Simulates floating point: 49.996 + 50.000 = 99.996, diff = 0.004 < 0.01
    expect(splitCardsValid(49.996, 50.000, 100.000)).toBe(true);
  });
});
