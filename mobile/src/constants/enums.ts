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
