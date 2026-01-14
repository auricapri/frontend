import { describe, expect, test } from 'vitest';
import { maskCep, normalizeCepDigits } from './masks';

describe('CEP masks', () => {
  test('normalizeCepDigits remove não dígitos e limita a 8', () => {
    expect(normalizeCepDigits('01.310-100')).toBe('01310100');
    expect(normalizeCepDigits('abc01310-100xyz')).toBe('01310100');
    expect(normalizeCepDigits('013101001234')).toBe('01310100');
  });

  test('maskCep aplica formatação XXXXX-XXX', () => {
    expect(maskCep('')).toBe('');
    expect(maskCep('1')).toBe('1');
    expect(maskCep('12345')).toBe('12345');
    expect(maskCep('123456')).toBe('12345-6');
    expect(maskCep('12345678')).toBe('12345-678');
    expect(maskCep('12.345-678')).toBe('12345-678');
    expect(maskCep('123456789')).toBe('12345-678');
  });
});

