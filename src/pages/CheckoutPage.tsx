import React from 'react';
import CheckoutView from '../components/checkout/CheckoutViewV2';
import { AddressData } from '../components/checkout';
import { CartItem, InternalLogisticsInfo, UserProfile, StoreConfig, UserMode } from '../types';
import { PaymentMethod } from '../constants/enums';
import { Locale } from '../i18n';

interface CheckoutPageProps {
  items: CartItem[];
  currentUser: UserProfile | null;
  storeConfig?: StoreConfig;
  userMode: UserMode;
  onBack: () => void;
  onComplete: (
    address: AddressData,
    logistics: InternalLogisticsInfo,
    paymentMethod: PaymentMethod,
    finalAmount: number,
    saveCard: boolean,
    cardToken?: string,
    phone?: string
  ) => void;
  t: (key: string) => any;
  locale: Locale;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  currentUser,
  storeConfig,
  userMode,
  onBack,
  onComplete,
  t,
  locale
}) => {
  return (
    <CheckoutView
      items={items}
      currentUser={currentUser}
      storeConfig={storeConfig}
      userMode={userMode}
      onBack={onBack}
      onComplete={onComplete}
      locale={locale}
      t={t}
    />
  );
};

