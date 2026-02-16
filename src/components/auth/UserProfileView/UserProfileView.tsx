/// UserProfileView - Main Component
/// Orchestrates all subcomponents for user profile management
///
/// Structure:
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

import React, { useState, useEffect, Suspense } from 'react';
import { LoadingFallback } from '../../ui/LoadingFallback';
import { UserProfileViewProps, TabId } from './types';
import { useProfileState, useOrders, useAddresses, createGetLoc } from './hooks';
import { apiClient } from '../../../api/client';
import { supabase } from '../../../utils/supabase';
import {
  TabNavigation,
  ProfileTab,
  OrdersTab,
  AddressesTab,
  AffiliateTab,
  OrderDetailOverlay,
} from './components';

const OrderReceipt = React.lazy(() => import('../../orders/OrderReceipt'));

const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  t,
  locale,
  onUpdate,
  onLogout,
  storeConfig,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const getLoc = createGetLoc(locale);

  // Profile state hook
  const { formState, setFullName, setPhone, setCpf, handleUpdateProfile } = useProfileState({
    user,
    locale,
    onUpdate,
  });

  // Orders hook
  const { ordersState, fetchOrders, setSelectedOrder, setViewingReceiptOrder } = useOrders({
    userId: user.id,
  });

  // Addresses hook
  const { addressesState, fetchAddresses, handleSetDefaultAddress, handleDeleteAddress } =
    useAddresses({
      userId: user.id,
      onUpdate,
    });

  // Delete account handler (LGPD Art. 18)
  const handleDeleteAccount = async () => {
    try {
      await apiClient.delete('/users/account');
      await supabase.auth.signOut();
      onLogout?.();
    } catch (error) {
      console.error('[DeleteAccount]', error);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'addresses') fetchAddresses();
  }, [activeTab, fetchOrders, fetchAddresses]);

  // Receipt view mode
  if (ordersState.viewingReceiptOrder) {
    return (
      <div className="fixed inset-0 z-[200] bg-white overflow-y-auto">
        <Suspense fallback={<LoadingFallback size="sm" message="Carregando pedido..." />}>
          <OrderReceipt
            order={ordersState.viewingReceiptOrder}
            onBack={() => setViewingReceiptOrder(null)}
            t={t}
            locale={locale}
            taxId={storeConfig?.tax_id}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} t={t} />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            locale={locale}
            t={t}
            formState={formState}
            onFullNameChange={setFullName}
            onPhoneChange={setPhone}
            onCpfChange={setCpf}
            onSubmit={handleUpdateProfile}
            onLogout={onLogout}
            onDeleteAccount={handleDeleteAccount}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersTab
            ordersState={ordersState}
            locale={locale}
            t={t}
            storeConfig={storeConfig}
            onSelectOrder={setSelectedOrder}
          />
        )}

        {activeTab === 'addresses' && (
          <AddressesTab
            addressesState={addressesState}
            onSetDefault={handleSetDefaultAddress}
            onDelete={handleDeleteAddress}
          />
        )}

        {activeTab === 'affiliate' && <AffiliateTab user={user} locale={locale} />}
      </div>

      {/* Order Detail Overlay */}
      {ordersState.selectedOrder && (
        <OrderDetailOverlay
          order={ordersState.selectedOrder}
          locale={locale}
          t={t}
          getLoc={getLoc}
          onClose={() => setSelectedOrder(null)}
          onViewReceipt={() => setViewingReceiptOrder(ordersState.selectedOrder)}
        />
      )}
    </div>
  );
};

export default UserProfileView;
