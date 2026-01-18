import dotenv from 'dotenv';
import { decrypt, isEncrypted } from '../utils/crypto.js';

dotenv.config();

const MASTER_KEY = process.env.MASTER_KEY || '';

function getSecret(key: string): string {
  const value = process.env[key] || '';
  if (isEncrypted(value)) {
    if (!MASTER_KEY) {
      console.warn(`[Config] Attempting to decrypt ${key} but MASTER_KEY is not set.`);
      return value;
    }
    try {
      return decrypt(value, MASTER_KEY);
    } catch (err) {
      console.error(`[Config] Failed to decrypt ${key}:`, err);
      return value;
    }
  }
  return value;
}

export const env = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  supabaseMonitoring: {
    egressBudgetBytesPerHour: parseInt(process.env.SUPABASE_EGRESS_BUDGET_BYTES_PER_HOUR || '0', 10),
    alertThresholdPercent: parseInt(process.env.SUPABASE_ALERT_THRESHOLD_PERCENT || '80', 10),
    maxConcurrentRequests: parseInt(process.env.SUPABASE_MAX_CONCURRENT_REQUESTS || '20', 10),
    maxQueuedRequests: parseInt(process.env.SUPABASE_MAX_QUEUED_REQUESTS || '200', 10),
  },
  weather: {
    openWeatherMapApiKey: getSecret('OPEN_WEATHER_MAP_API_KEY'),
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    // Allow mobile web dev server as well
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'],
  },
  cleanup: {
    // Dias antes de remover card completado (padrão: 2)
    days: parseInt(process.env.CLEANUP_DAYS || '2', 10),
    // Intervalo de execução em horas (padrão: 6)
    intervalHours: parseInt(process.env.CLEANUP_INTERVAL_HOURS || '6', 10),
    // Ativar/desativar limpeza automática (padrão: true)
    enabled: process.env.AUTO_CLEANUP_ENABLED !== 'false',
  },
  redis: {
    url: process.env.REDIS_URL || '',
    primaryUrl: process.env.REDIS_URL_SERVER_PRIMARY || process.env.REDIS_URL || '',
    secondaryUrl: process.env.REDIS_URL_SERVER_SECONDARY || '',
  },
  tax: {
    enabled: process.env.TAX_DATA_SYNC_ENABLED !== 'false',
    remoteBaseUrl: process.env.TAX_DATA_REMOTE_BASE_URL || '',
    syncIntervalHours: parseInt(process.env.TAX_DATA_SYNC_INTERVAL_HOURS || '24', 10),
    cacheTtlMs: parseInt(process.env.TAX_DATA_CACHE_TTL_MS || String(24 * 60 * 60 * 1000), 10),
    requestTimeoutMs: parseInt(process.env.TAX_DATA_REQUEST_TIMEOUT_MS || '8000', 10),
    maxRetries: parseInt(process.env.TAX_DATA_MAX_RETRIES || '3', 10),
  },
  tracking: {
    // Tamanho do batch de eventos (padrão: 500)
    batchSize: parseInt(process.env.TRACKING_BATCH_SIZE || '500', 10),
    // Intervalo de processamento em ms (padrão: 30000 = 30s)
    intervalMs: parseInt(process.env.TRACKING_INTERVAL_MS || '30000', 10),
    // Tamanho máximo da fila Redis (padrão: 20000)
    maxQueueLen: parseInt(process.env.TRACKING_MAX_QUEUE_LEN || '20000', 10),
  },
};

// Validate required environment variables
if (!env.supabase.url || !env.supabase.serviceRoleKey) {
  throw new Error('Missing required Supabase environment variables');
}
