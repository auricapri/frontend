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
  PIX = 'pix'
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
