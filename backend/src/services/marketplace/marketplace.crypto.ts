import { encrypt, decrypt, isEncrypted } from '../../utils/crypto.js';
import logger from '../../config/logger.js';

export interface MarketplaceCredentials {
  [key: string]: string;
}

/**
 * Utility class for encrypting/decrypting marketplace credentials.
 * Uses AES-256-CBC encryption with the master key from environment.
 */
export class MarketplaceCrypto {
  private masterKey: string;

  constructor(masterKey: string) {
    if (!masterKey || masterKey.length !== 32) {
      throw new Error('MASTER_KEY must be exactly 32 characters long');
    }
    this.masterKey = masterKey;
  }

  /**
   * Encrypts marketplace credentials object to a single encrypted string.
   * @param credentials Object with key-value pairs (e.g., { client_id: '...', client_secret: '...' })
   * @returns Encrypted string in format "iv:encrypted_hex"
   */
  encryptCredentials(credentials: MarketplaceCredentials): string {
    try {
      const json = JSON.stringify(credentials);
      return encrypt(json, this.masterKey);
    } catch (error) {
      logger.error('Failed to encrypt marketplace credentials', { error });
      throw new Error('Failed to encrypt credentials');
    }
  }

  /**
   * Decrypts an encrypted credentials string back to an object.
   * @param encryptedCredentials Encrypted string
   * @returns Decrypted credentials object
   */
  decryptCredentials(encryptedCredentials: string): MarketplaceCredentials {
    try {
      if (!isEncrypted(encryptedCredentials)) {
        // If not encrypted, might be a plain JSON (for backwards compatibility during development)
        try {
          return JSON.parse(encryptedCredentials);
        } catch {
          throw new Error('Invalid credentials format');
        }
      }
      const json = decrypt(encryptedCredentials, this.masterKey);
      return JSON.parse(json);
    } catch (error) {
      logger.error('Failed to decrypt marketplace credentials', { error });
      throw new Error('Failed to decrypt credentials');
    }
  }

  /**
   * Encrypts a single token string.
   * @param token The access/refresh token to encrypt
   * @returns Encrypted token string
   */
  encryptToken(token: string): string {
    try {
      return encrypt(token, this.masterKey);
    } catch (error) {
      logger.error('Failed to encrypt token', { error });
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Decrypts a single token string.
   * @param encryptedToken The encrypted token
   * @returns Decrypted token string
   */
  decryptToken(encryptedToken: string): string {
    try {
      if (!isEncrypted(encryptedToken)) {
        // Return as-is if not encrypted (development mode)
        return encryptedToken;
      }
      return decrypt(encryptedToken, this.masterKey);
    } catch (error) {
      logger.error('Failed to decrypt token', { error });
      throw new Error('Failed to decrypt token');
    }
  }

  /**
   * Validates if a string is encrypted using our format.
   */
  isEncrypted(text: string): boolean {
    return isEncrypted(text);
  }

  /**
   * Safely updates specific credential fields without exposing existing ones.
   * @param encryptedCredentials Current encrypted credentials
   * @param updates Fields to update
   * @returns New encrypted credentials string
   */
  updateCredentials(encryptedCredentials: string, updates: Partial<MarketplaceCredentials>): string {
    const current = this.decryptCredentials(encryptedCredentials);
    // Filter out undefined values from updates
    const filteredUpdates: MarketplaceCredentials = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    const updated: MarketplaceCredentials = { ...current, ...filteredUpdates };
    return this.encryptCredentials(updated);
  }

  /**
   * Masks sensitive credential values for safe logging/display.
   * @param credentials Decrypted credentials
   * @returns Credentials with values masked (e.g., "abc***xyz")
   */
  static maskCredentials(credentials: MarketplaceCredentials): MarketplaceCredentials {
    const masked: MarketplaceCredentials = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (typeof value === 'string' && value.length > 6) {
        masked[key] = value.substring(0, 3) + '***' + value.substring(value.length - 3);
      } else if (typeof value === 'string') {
        masked[key] = '***';
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }
}

// Singleton instance - initialized lazily
let cryptoInstance: MarketplaceCrypto | null = null;

/**
 * Gets the singleton MarketplaceCrypto instance.
 * @param masterKey Optional master key (only used on first call)
 */
export function getMarketplaceCrypto(masterKey?: string): MarketplaceCrypto {
  if (!cryptoInstance) {
    const key = masterKey || process.env.MASTER_KEY;
    if (!key) {
      throw new Error('MASTER_KEY environment variable is required');
    }
    cryptoInstance = new MarketplaceCrypto(key);
  }
  return cryptoInstance;
}

export default MarketplaceCrypto;
