
import { maskPhone, maskCPF, maskCNPJ, maskCreditCard, unmask } from '../utils/masks';
import { parseAffiliateParams, normalizeProductUrl } from '../utils/affiliate';

describe('Frontend Utilities', () => {
  describe('Input Masks', () => {
    test('maskPhone should format phone numbers correctly', () => {
      expect(maskPhone('11999999999')).toBe('(11) 99999-9999');
      expect(maskPhone('1188888888')).toBe('(11) 8888-8888');
    });

    test('maskCPF should format CPF correctly', () => {
      expect(maskCPF('12345678901')).toBe('123.456.789-01');
    });

    test('maskCNPJ should format CNPJ correctly', () => {
      expect(maskCNPJ('12345678000199')).toBe('12.345.678/0001-99');
    });

    test('maskCreditCard should format card numbers with spaces', () => {
      expect(maskCreditCard('1234567812345678')).toBe('1234 5678 1234 5678');
    });

    test('unmask should remove non-digits', () => {
      expect(unmask('(11) 99999-9999')).toBe('11999999999');
    });
  });

  describe('Affiliate Utilities', () => {
    test('parseAffiliateParams should extract params from URL', () => {
      const url = 'https://auricapri.com/product/123?aff=marcus&utm_campaign=summer';
      const params = parseAffiliateParams(url);
      expect(params?.affiliateId).toBe('marcus');
      expect(params?.campaignId).toBe('summer');
    });

    test('normalizeProductUrl should add affiliate params', () => {
      const baseUrl = 'https://auricapri.com/product/123';
      const normalized = normalizeProductUrl(baseUrl, 'marcus');
      expect(normalized).toContain('aff=marcus');
      expect(normalized).toContain('utm_source=auricapri_internal');
    });
  });
});
