/**
 * Logger utilitario para o frontend
 * Centraliza logs e permite desabilitar em producao
 */

const isDev = import.meta.env.DEV;

interface LoggerOptions {
  context?: string;
}

function formatMessage(level: string, message: string, context?: string): string {
  const timestamp = new Date().toISOString();
  const prefix = context ? `[${context}]` : '';
  return `${timestamp} ${level} ${prefix} ${message}`;
}

export const logger = {
  info(message: string, data?: unknown, options?: LoggerOptions) {
    if (isDev) {
      console.info(formatMessage('INFO', message, options?.context), data ?? '');
    }
  },

  warn(message: string, data?: unknown, options?: LoggerOptions) {
    if (isDev) {
      console.warn(formatMessage('WARN', message, options?.context), data ?? '');
    }
  },

  error(message: string, error?: unknown, options?: LoggerOptions) {
    // Sempre loga erros, mesmo em producao
    const errorMessage = error instanceof Error ? error.message : String(error ?? '');
    console.error(formatMessage('ERROR', message, options?.context), errorMessage);
  },

  debug(message: string, data?: unknown, options?: LoggerOptions) {
    if (isDev) {
      console.debug(formatMessage('DEBUG', message, options?.context), data ?? '');
    }
  },
};

export default logger;
