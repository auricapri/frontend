
import { describe, test, expect } from 'vitest';
import { encrypt, decrypt, isEncrypted } from './src/utils/crypto';

describe('Backend Crypto Utilities', () => {
  const MASTER_KEY = '12345678901234567890123456789012'; // 32 chars
  const SECRET = 'my-super-secret-api-key';

  test('should encrypt and decrypt correctly', () => {
    const encrypted = encrypt(SECRET, MASTER_KEY);
    expect(encrypted).not.toBe(SECRET);
    expect(isEncrypted(encrypted)).toBe(true);

    const decrypted = decrypt(encrypted, MASTER_KEY);
    expect(decrypted).toBe(SECRET);
  });

  test('should throw error with invalid master key length', () => {
    expect(() => encrypt(SECRET, 'short')).toThrow();
  });

  test('isEncrypted should validate format', () => {
    expect(isEncrypted('some-random-string')).toBe(false);
    const validEncrypted = '0123456789abcdef0123456789abcdef:0123456789abcdef';
    expect(isEncrypted(validEncrypted)).toBe(true);
  });
});
