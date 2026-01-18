export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  PIX = 'pix',
  BOLETO = 'boleto'
}

export enum UserRole {
  ADMIN = 'admin',
  DELIVERY = 'delivery',
  USER = 'user'
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PIX = 'pix',
  PAGARME = 'pagarme',
  MERCADOPAGO = 'mercadopago',
  ASAAS = 'asaas',
  CIELO = 'cielo',
  REDE = 'rede',
  OTHER = 'other'
}

export enum NotificationType {
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  REVIEW_SUBMITTED = 'review_submitted',
  LOYALTY_LEVEL_UP = 'loyalty_level_up'
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video'
}

export enum Locale {
  PT = 'pt',
  EN = 'en',
  ES = 'es',
  FR = 'fr'
}

export const OrderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: []
};

export function isValidOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return OrderStatusTransitions[from].includes(to);
}
