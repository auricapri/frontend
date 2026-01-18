import logger from '../config/logger.js';
import { env } from '../config/env.js';
import { TaxDataRepository } from '../repositories/tax-data.repository.js';
import { fetchJsonWithRetry } from '../utils/http-client.js';

interface RemoteIcmsRateRow {
  origin_state: string;
  destination_state: string;
  rate_internal: number;
  rate_interstate: number;
  difal_applicable: boolean;
}

export class TaxDataSyncService {
  private repo = new TaxDataRepository();

  async ensureSeedJobs(): Promise<void> {
    if (!env.tax.enabled) return;

    await this.repo.enqueueJob('sync:icms_rates', { source: 'remote' }, new Date(), 5);
    await this.repo.enqueueJob('sync:municipalities', { source: 'ibge' }, new Date(), 5);
  }

  async runDueJobs(): Promise<void> {
    if (!env.tax.enabled) return;

    const jobs = await this.repo.listDueJobs(25);
    if (jobs.length === 0) return;

    logger.info('Running tax sync jobs', { count: jobs.length });

    for (const job of jobs) {
      const claimed = await this.repo.markJobProcessing(job.id);
      if (!claimed) continue;

      try {
        if (job.job_type === 'sync:icms_rates') {
          await this.syncIcmsRates();
        } else if (job.job_type === 'sync:municipalities') {
          await this.syncMunicipalities();
        } else {
          throw new Error(`Unknown job type: ${job.job_type}`);
        }

        await this.repo.markJobDone(job.id);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Tax sync job failed', { id: job.id, jobType: job.job_type, message });

        const nextRunAfter = new Date(Date.now() + 15 * 60 * 1000);
        await this.repo.markJobFailed(job.id, message, nextRunAfter);
      }
    }
  }

  async syncIcmsRates(): Promise<void> {
    if (!env.tax.remoteBaseUrl) {
      logger.info('Tax remote base URL not set, skipping ICMS sync');
      return;
    }

    const url = `${env.tax.remoteBaseUrl.replace(/\/$/, '')}/icms_rates.json`;
    const data = await fetchJsonWithRetry<{
      version: string;
      rates: RemoteIcmsRateRow[];
    }>({
      url,
      timeoutMs: env.tax.requestTimeoutMs,
      maxRetries: env.tax.maxRetries,
    });

    if (!data?.version || !Array.isArray(data.rates)) {
      throw new Error('Invalid ICMS rates payload');
    }

    await this.repo.setCache({
      key: 'snapshot:icms_rates',
      payload: { version: data.version, rates: data.rates },
      ttlMs: env.tax.cacheTtlMs,
      sourceVersion: data.version,
    });
    await this.repo.upsertVersion('icms_rates', data.version);

    logger.info('ICMS rates synced', { version: data.version, count: data.rates.length });
  }

  async syncMunicipalities(): Promise<void> {
    const url = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';
    const data = await fetchJsonWithRetry<unknown[]>({
      url,
      timeoutMs: env.tax.requestTimeoutMs,
      maxRetries: env.tax.maxRetries,
    });

    const version = new Date().toISOString().slice(0, 10);
    await this.repo.setCache({
      key: 'snapshot:ibge_municipalities',
      payload: { version, municipalities: data },
      ttlMs: env.tax.cacheTtlMs,
      sourceVersion: version,
    });
    await this.repo.upsertVersion('ibge_municipalities', version);

    logger.info('Municipalities synced (IBGE)', { version, count: data.length });
  }
}

let instance: TaxDataSyncService | null = null;
export function getTaxDataSyncService(): TaxDataSyncService {
  if (!instance) instance = new TaxDataSyncService();
  return instance;
}
