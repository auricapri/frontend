import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cachedVersion: string | null = null;

export function getVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const versionPath = join(__dirname, '../../VERSION');
    const version = readFileSync(versionPath, 'utf-8').trim();
    cachedVersion = version;
    return version;
  } catch (error) {
    logger.warn('Failed to read VERSION file, using default', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 'unknown';
  }
}
