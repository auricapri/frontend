import { CleanupRepository } from '../repositories/cleanup.repository.js';
import { CartRepository } from '../repositories/cart.repository.js';
import { getTrackingRepository } from '../repositories/tracking.repository.js';
import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { getRedisClient } from '../config/redis.js';
import { getTaxDataSyncService } from './tax-data-sync.service.js';

export class SchedulerService {
  private cleanupRepository: CleanupRepository;
  private cartRepository: CartRepository;
  private trackingRepository = getTrackingRepository();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private cartCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private taxSyncInterval: ReturnType<typeof setInterval> | null = null;
  private taxHistoryCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private tagDecayInterval: ReturnType<typeof setInterval> | null = null;
  private trackingAggregatesRefreshInterval: ReturnType<typeof setInterval> | null = null;
  private trackingPartitionsInterval: ReturnType<typeof setInterval> | null = null;
  private trackingCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private cleanupDays: number;
  private cleanupIntervalHours: number;
  private isEnabled: boolean;
  private redis = (env.redis.primaryUrl || env.redis.secondaryUrl || env.redis.url) ? getRedisClient(false) : null;
  private taxDataSync = getTaxDataSyncService();

  constructor() {
    this.cleanupRepository = new CleanupRepository();
    this.cartRepository = new CartRepository();
    
    // Configurações via variáveis de ambiente centralizadas
    this.cleanupDays = env.cleanup.days;
    this.cleanupIntervalHours = env.cleanup.intervalHours;
    this.isEnabled = env.cleanup.enabled;
  }

  private async withDistributedLock<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
    if (!this.redis) {
      return await fn();
    }

    const lockValue = `${process.pid}:${Date.now()}`;
    const acquired = await this.redis.set(key, lockValue, 'PX', ttlMs, 'NX');
    if (!acquired) {
      return null;
    }

    try {
      return await fn();
    } finally {
      const releaseScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      try {
        await this.redis.eval(releaseScript, 1, key, lockValue);
      } catch (error) {
        logger.warn('Failed to release scheduler lock', { key, error });
      }
    }
  }

  /**
   * Inicia o agendador de limpeza
   * Executa a cada X horas (configurável)
   */
  startCleanupScheduler(): void {
    if (!this.isEnabled) {
      logger.info('Cleanup scheduler disabled', { reason: 'AUTO_CLEANUP_ENABLED=false' });
      return;
    }

    // Executar imediatamente na inicialização
    this.runCleanup();
    this.runCartCleanup();
    this.runTaxSync();
    this.runTaxHistoryCleanup();
    this.runTagDecay();
    this.runTrackingAggregatesRefresh();
    this.runTrackingPartitions();
    this.runTrackingCleanup();

    // Depois, executar a cada X horas
    const intervalMs = this.cleanupIntervalHours * 60 * 60 * 1000;
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, intervalMs);

    // Limpeza de carrinhos expirados: diariamente (24 horas)
    const cartCleanupIntervalMs = 24 * 60 * 60 * 1000;
    this.cartCleanupInterval = setInterval(() => {
      this.runCartCleanup();
    }, cartCleanupIntervalMs);

    // Sync de dados tributários: diariamente (configurável via env.tax.syncIntervalHours)
    const taxSyncIntervalMs = env.tax.syncIntervalHours * 60 * 60 * 1000;
    this.taxSyncInterval = setInterval(() => {
      this.runTaxSync();
    }, taxSyncIntervalMs);

    // Limpeza de histórico tributário: diariamente (retenção de 5 anos)
    const taxHistoryCleanupIntervalMs = 24 * 60 * 60 * 1000;
    this.taxHistoryCleanupInterval = setInterval(() => {
      this.runTaxHistoryCleanup();
    }, taxHistoryCleanupIntervalMs);

    // Decaimento de tags de usuário: semanalmente (7 dias)
    const tagDecayIntervalMs = 7 * 24 * 60 * 60 * 1000;
    this.tagDecayInterval = setInterval(() => {
      this.runTagDecay();
    }, tagDecayIntervalMs);

    // Refresh de materialized views de tracking: diariamente (24 horas)
    const trackingAggregatesIntervalMs = 24 * 60 * 60 * 1000;
    this.trackingAggregatesRefreshInterval = setInterval(() => {
      this.runTrackingAggregatesRefresh();
    }, trackingAggregatesIntervalMs);

    // Criação de partições de tracking: mensalmente (30 dias)
    const trackingPartitionsIntervalMs = 30 * 24 * 60 * 60 * 1000;
    this.trackingPartitionsInterval = setInterval(() => {
      this.runTrackingPartitions();
    }, trackingPartitionsIntervalMs);

    // Limpeza de eventos antigos de tracking: diariamente (retenção de 30 dias para page_view, 90 dias para outros)
    const trackingCleanupIntervalMs = 24 * 60 * 60 * 1000;
    this.trackingCleanupInterval = setInterval(() => {
      this.runTrackingCleanup();
    }, trackingCleanupIntervalMs);

    logger.info('Cleanup scheduler started', {
      intervalHours: this.cleanupIntervalHours,
      cleanupDays: this.cleanupDays,
    });
  }

  /**
   * Para o agendador
   */
  stopCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.cartCleanupInterval) {
      clearInterval(this.cartCleanupInterval);
      this.cartCleanupInterval = null;
    }
    if (this.taxSyncInterval) {
      clearInterval(this.taxSyncInterval);
      this.taxSyncInterval = null;
    }
    if (this.taxHistoryCleanupInterval) {
      clearInterval(this.taxHistoryCleanupInterval);
      this.taxHistoryCleanupInterval = null;
    }
    if (this.tagDecayInterval) {
      clearInterval(this.tagDecayInterval);
      this.tagDecayInterval = null;
    }
    if (this.trackingAggregatesRefreshInterval) {
      clearInterval(this.trackingAggregatesRefreshInterval);
      this.trackingAggregatesRefreshInterval = null;
    }
    if (this.trackingPartitionsInterval) {
      clearInterval(this.trackingPartitionsInterval);
      this.trackingPartitionsInterval = null;
    }
    if (this.trackingCleanupInterval) {
      clearInterval(this.trackingCleanupInterval);
      this.trackingCleanupInterval = null;
    }
    logger.info('Cleanup scheduler stopped');
  }

  async runTagDecay(): Promise<void> {
    try {
      const { getUserProfileService } = await import('./user-profile.service.js');
      const result = await this.withDistributedLock('scheduler:marketing:tag_decay', 20 * 60 * 1000, async () => {
        await getUserProfileService().applyTagDecay();
        return true;
      });

      if (result === null) {
        logger.debug('Tag decay skipped due to lock');
      }
    } catch (error: unknown) {
      logger.error('Error executing tag decay', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Executa a limpeza manualmente
   */
  async runCleanup(): Promise<void> {
    logger.info('Running scheduled cleanup');
    
    try {
      const result = await this.withDistributedLock('scheduler:cleanup:dream_cards', 10 * 60 * 1000, async () => {
        return await this.cleanupRepository.cleanupCompletedDreamCards(this.cleanupDays);
      });

      if (!result) {
        logger.debug('Cleanup skipped due to lock');
        return;
      }
      
      if (result.deletedCount > 0) {
        logger.info('Cleanup executed successfully', {
          deletedCount: result.deletedCount,
        });
      } else {
        logger.debug('Cleanup executed, no cards to remove');
      }

      if (result.errors.length > 0) {
        logger.warn('Errors during cleanup', { errors: result.errors });
      }

      const collectionsCleanup = await this.withDistributedLock('scheduler:cleanup:collections_soft_deleted', 10 * 60 * 1000, async () => {
        return await this.cleanupRepository.cleanupSoftDeletedCollections(30);
      });

      if (collectionsCleanup && collectionsCleanup.deletedCount > 0) {
        logger.info('Soft-deleted collections cleanup executed', { deletedCount: collectionsCleanup.deletedCount });
      }
      if (collectionsCleanup && collectionsCleanup.errors.length > 0) {
        logger.warn('Errors during soft-deleted collections cleanup', { errors: collectionsCleanup.errors });
      }
    } catch (error: unknown) {
      logger.error('Error executing cleanup', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Executa limpeza de carrinhos expirados
   */
  async runCartCleanup(): Promise<void> {
    logger.info('Running scheduled cart cleanup');
    
    try {
      const deletedCount = await this.withDistributedLock('scheduler:cleanup:cart_sessions', 10 * 60 * 1000, async () => {
        return await this.cartRepository.cleanupExpiredCarts();
      });

      if (deletedCount === null) {
        logger.debug('Cart cleanup skipped due to lock');
        return;
      }
      
      if (deletedCount > 0) {
        logger.info('Cart cleanup executed successfully', {
          deletedCount,
        });
      } else {
        logger.debug('Cart cleanup executed, no carts to remove');
      }
    } catch (error: unknown) {
      logger.error('Error executing cart cleanup', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async runTaxSync(): Promise<void> {
    try {
      const result = await this.withDistributedLock('scheduler:tax:sync', 20 * 60 * 1000, async () => {
        await this.taxDataSync.ensureSeedJobs();
        await this.taxDataSync.runDueJobs();
      });

      if (result === null) {
        logger.debug('Tax sync skipped due to lock');
      }
    } catch (error: unknown) {
      logger.error('Error executing tax sync', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async runTaxHistoryCleanup(): Promise<void> {
    try {
      const { getTaxHistoryService } = await import('./tax-history.service.js');
      const deleted = await this.withDistributedLock('scheduler:tax:history_cleanup', 20 * 60 * 1000, async () => {
        return await getTaxHistoryService().cleanupRetentionYears(5);
      });

      if (deleted === null) {
        logger.debug('Tax history cleanup skipped due to lock');
        return;
      }
      if (deleted > 0) {
        logger.info('Tax history cleanup executed', { deleted });
      }
    } catch (error: unknown) {
      logger.error('Error executing tax history cleanup', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async runTrackingAggregatesRefresh(): Promise<void> {
    try {
      const result = await this.withDistributedLock('scheduler:tracking:refresh_aggregates', 10 * 60 * 1000, async () => {
        await this.trackingRepository.refreshAggregates();
        return true;
      });

      if (result === null) {
        logger.debug('Tracking aggregates refresh skipped due to lock');
        return;
      }

      logger.info('Tracking aggregates refreshed successfully');
    } catch (error: unknown) {
      logger.error('Error refreshing tracking aggregates', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async runTrackingPartitions(): Promise<void> {
    try {
      const result = await this.withDistributedLock('scheduler:tracking:create_partitions', 10 * 60 * 1000, async () => {
        await this.trackingRepository.createPartitions();
        return true;
      });

      if (result === null) {
        logger.debug('Tracking partitions creation skipped due to lock');
        return;
      }

      logger.info('Tracking partitions created/verified successfully');
    } catch (error: unknown) {
      logger.error('Error creating tracking partitions', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async runTrackingCleanup(): Promise<void> {
    try {
      const result = await this.withDistributedLock('scheduler:tracking:cleanup_old_events', 30 * 60 * 1000, async () => {
        await this.trackingRepository.cleanupOldEvents();
        return true;
      });

      if (result === null) {
        logger.debug('Tracking cleanup skipped due to lock');
        return;
      }

      logger.info('Tracking cleanup executed successfully');
    } catch (error: unknown) {
      logger.error('Error executing tracking cleanup', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Retorna status do scheduler
   */
  getStatus(): { enabled: boolean; cleanupDays: number; intervalHours: number; isRunning: boolean } {
    return {
      enabled: this.isEnabled,
      cleanupDays: this.cleanupDays,
      intervalHours: this.cleanupIntervalHours,
      isRunning:
        this.cleanupInterval !== null ||
        this.cartCleanupInterval !== null ||
        this.taxSyncInterval !== null ||
        this.taxHistoryCleanupInterval !== null ||
        this.tagDecayInterval !== null ||
        this.trackingAggregatesRefreshInterval !== null ||
        this.trackingPartitionsInterval !== null ||
        this.trackingCleanupInterval !== null,
    };
  }
}

// Singleton para uso global
let schedulerInstance: SchedulerService | null = null;

export function getSchedulerService(): SchedulerService {
  if (!schedulerInstance) {
    schedulerInstance = new SchedulerService();
  }
  return schedulerInstance;
}
