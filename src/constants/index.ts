// Application constants (no mocks)

export const WHATSAPP_LINK = 'https://wa.me/AURICAPRI';

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

