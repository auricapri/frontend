/**
 * Application hooks - organized by responsibility
 *
 * useAppState: Main composition hook that combines all smaller hooks
 * useNavigation: Routing, view management, URL handling
 * useToast: Toast notification state
 * useDrawers: UI drawer states (cart, wishlist, coupons, auth)
 * useLoyalty: Loyalty banner and reward handling
 * useOrderProcessing: Order creation and processing
 */

export { useAppState, type AppView } from './useAppState';
export { useNavigation } from './useNavigation';
export { useToast, type Toast } from './useToast';
export { useDrawers, type DrawersState } from './useDrawers';
export { useLoyalty, type LoyaltyBanner } from './useLoyalty';
export { useOrderProcessing } from './useOrderProcessing';
