/**
 * Enums compartilhados entre frontend e backend
 * NOTA: Mantenha sincronizado com backend/shared/types/enums.ts
 */

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  AWAITING_PICKUP = 'awaiting_pickup',  // Aguardando coleta pelo delivery
  COLLECTED = 'collected',               // Coletado - em trânsito para expedição
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
  [OrderStatus.CONFIRMED]: [OrderStatus.AWAITING_PICKUP, OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.AWAITING_PICKUP]: [OrderStatus.COLLECTED, OrderStatus.CANCELLED],
  [OrderStatus.COLLECTED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: []
};

export function isValidOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return OrderStatusTransitions[from].includes(to);
}

export enum View {
  HOME = 'home',
  PRODUCT = 'product',
  COLLECTION = 'collection',
  ADMIN = 'admin',
  ADMIN_LOGIN = 'admin-login',
  DELIVERY = 'delivery',
  DELIVERY_LOGIN = 'delivery-login',
  CHECKOUT = 'checkout',
  RECEIPT = 'receipt',
  ABOUT = 'about',
  RESET_PASSWORD = 'reset-password',
  SHARED_WISHLIST = 'shared-wishlist',
  ORDER_REVIEW = 'order-review'
}

export enum Gender {
  FEMALE = 'female',
  MALE = 'male',
  UNISEX = 'unisex'
}
