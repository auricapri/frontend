export var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (OrderStatus = {}));
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CREDIT_CARD"] = "credit_card";
    PaymentMethod["PIX"] = "pix";
})(PaymentMethod || (PaymentMethod = {}));
export var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["DELIVERY"] = "delivery";
    UserRole["USER"] = "user";
})(UserRole || (UserRole = {}));
export var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["STRIPE"] = "stripe";
    PaymentProvider["PIX"] = "pix";
    PaymentProvider["PAGARME"] = "pagarme";
    PaymentProvider["MERCADOPAGO"] = "mercadopago";
    PaymentProvider["ASAAS"] = "asaas";
    PaymentProvider["CIELO"] = "cielo";
    PaymentProvider["REDE"] = "rede";
    PaymentProvider["OTHER"] = "other";
})(PaymentProvider || (PaymentProvider = {}));
export var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER_CONFIRMED"] = "order_confirmed";
    NotificationType["ORDER_SHIPPED"] = "order_shipped";
    NotificationType["ORDER_DELIVERED"] = "order_delivered";
    NotificationType["ORDER_CANCELLED"] = "order_cancelled";
    NotificationType["REVIEW_SUBMITTED"] = "review_submitted";
    NotificationType["LOYALTY_LEVEL_UP"] = "loyalty_level_up";
})(NotificationType || (NotificationType = {}));
export var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "image";
    MediaType["VIDEO"] = "video";
})(MediaType || (MediaType = {}));
export var Locale;
(function (Locale) {
    Locale["PT"] = "pt";
    Locale["EN"] = "en";
    Locale["ES"] = "es";
    Locale["FR"] = "fr";
})(Locale || (Locale = {}));
export const OrderStatusTransitions = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: []
};
export function isValidOrderStatusTransition(from, to) {
    return OrderStatusTransitions[from].includes(to);
}
//# sourceMappingURL=enums.js.map