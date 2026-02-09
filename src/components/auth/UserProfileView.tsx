/// UserProfileView
///
/// Re-exports the modular UserProfileView from the UserProfileView/ folder.
/// All functionality is now componentized in separate files:
///
/// - UserProfileView.tsx (~100 lines) - Main orchestrator
/// - types.ts (~55 lines) - Type definitions
/// - hooks/
///   - useProfileState.ts (~75 lines) - Profile form state
///   - useOrders.ts (~65 lines) - Orders management
///   - useAddresses.ts (~75 lines) - Addresses management
/// - components/
///   - TabNavigation.tsx (~45 lines) - Tab navigation
///   - LoyaltyCard.tsx (~65 lines) - Loyalty status card
///   - ProfileTab.tsx (~115 lines) - Profile form tab
///   - OrdersTab.tsx (~130 lines) - Orders list tab
///   - AddressesTab.tsx (~115 lines) - Addresses tab
///   - AffiliateTab.tsx (~90 lines) - Affiliate info tab
///   - OrderDetailOverlay.tsx (~145 lines) - Order detail modal
///
/// Total: ~1075 lines split into 13 files (all under 500 lines)

export { default } from './UserProfileView/index';
export * from './UserProfileView/index';
