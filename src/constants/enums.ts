/**
 * Re-export all enums from @auricapri/shared
 * This ensures a single source of truth for enums across frontend and backend
 */
export {
  OrderStatus,
  PaymentMethod,
  UserRole,
  PaymentProvider,
  NotificationType,
  MediaType,
  Locale,
  View,
  Gender,
  OrderStatusTransitions,
  isValidOrderStatusTransition
} from '@auricapri/shared';
