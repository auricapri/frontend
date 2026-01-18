
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypts a string using a master key.
 * @param text The text to encrypt
 * @param masterKey A 32-character (256-bit) string
 */
export function encrypt(text: string, masterKey: string): string {
  if (masterKey.length !== 32) {
    throw new Error('Master key must be exactly 32 characters long');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(masterKey), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts a string using a master key.
 * @param encryptedText The encrypted text in the format "iv:encrypted"
 * @param masterKey A 32-character (256-bit) string
 */
export function decrypt(encryptedText: string, masterKey: string): string {
  if (masterKey.length !== 32) {
    throw new Error('Master key must be exactly 32 characters long');
  }

  const textParts = encryptedText.split(':');
  const ivStr = textParts.shift();
  if (!ivStr) throw new Error('Invalid encrypted format');
  
  const iv = Buffer.from(ivStr, 'hex');
  const encryptedTextBuffer = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(masterKey), iv);
  let decrypted = decipher.update(encryptedTextBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * Validates if a string is likely encrypted with our format.
 */
export function isEncrypted(text: string): boolean {
  return /^[0-9a-f]{32}:[0-9a-f]+$/i.test(text);
}
