import crypto from 'crypto';
import logger from '../config/logger.js';
import { TaxHistoryRepository } from '../repositories/tax-history.repository.js';
import { TaxDataRepository } from '../repositories/tax-data.repository.js';

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const entries = keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${entries.join(',')}}`;
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export class TaxHistoryService {
  private repo = new TaxHistoryRepository();
  private dataRepo = new TaxDataRepository();

  async record(input: unknown, result: unknown): Promise<void> {
    try {
      const requestHash = sha256Hex(stableStringify(input));

      const [icmsVersion, municipalitiesVersion] = await Promise.all([
        this.dataRepo.getVersion('icms_rates'),
        this.dataRepo.getVersion('ibge_municipalities'),
      ]);

      await this.repo.insert({
        requestHash,
        input,
        result,
        dataVersions: {
          icms_rates: icmsVersion,
          ibge_municipalities: municipalitiesVersion,
        },
      });
    } catch (error: unknown) {
      logger.warn('Failed to record tax history', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  async cleanupRetentionYears(years: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - years);
    return await this.repo.deleteOlderThan(cutoff);
  }
}

let singleton: TaxHistoryService | null = null;
export function getTaxHistoryService(): TaxHistoryService {
  if (!singleton) singleton = new TaxHistoryService();
  return singleton;
}

