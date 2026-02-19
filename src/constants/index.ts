// Application constants (no mocks)

/**
 * Build a WhatsApp link from a phone number.
 * The phone number comes from storeConfig.support_phone (Supabase).
 * Returns empty string if no phone is provided.
 */
export function getWhatsAppLink(phone?: string): string {
  if (!phone) return '';
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}

/** @deprecated Use getWhatsAppLink(storeConfig.support_phone) instead */
export const WHATSAPP_LINK = '';

export const DEFAULT_LOCALE = 'pt' as const;

export const USER_MODES = {
  VAREJO: 'VAREJO',
  ATACADO: 'ATACADO'
} as const;

export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  PIX: 'pix'
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

