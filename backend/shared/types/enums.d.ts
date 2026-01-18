export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare enum PaymentMethod {
    CREDIT_CARD = "credit_card",
    PIX = "pix"
}
export declare enum UserRole {
    ADMIN = "admin",
    DELIVERY = "delivery",
    USER = "user"
}
export declare enum PaymentProvider {
    STRIPE = "stripe",
    PIX = "pix",
    PAGARME = "pagarme",
    MERCADOPAGO = "mercadopago",
    ASAAS = "asaas",
    CIELO = "cielo",
    REDE = "rede",
    OTHER = "other"
}
export declare enum NotificationType {
    ORDER_CONFIRMED = "order_confirmed",
    ORDER_SHIPPED = "order_shipped",
    ORDER_DELIVERED = "order_delivered",
    ORDER_CANCELLED = "order_cancelled",
    REVIEW_SUBMITTED = "review_submitted",
    LOYALTY_LEVEL_UP = "loyalty_level_up"
}
export declare enum MediaType {
    IMAGE = "image",
    VIDEO = "video"
}
export declare enum Locale {
    PT = "pt",
    EN = "en",
    ES = "es",
    FR = "fr"
}
export declare const OrderStatusTransitions: Record<OrderStatus, OrderStatus[]>;
export declare function isValidOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean;
//# sourceMappingURL=enums.d.ts.map