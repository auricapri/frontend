/**
 * CheckoutPage Component - React Native
 * Simple wrapper around CheckoutView
 */

import React from 'react';
import { CheckoutView, AddressData } from '../components/checkout';
import { CardData } from '../components/checkout/PaymentForm';
import { CartItem, InternalLogisticsInfo, UserProfile, StoreConfig, UserMode } from '../types';
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
    paymentMethod: 'credit_card' | 'pix',
    finalAmount: number,
    saveCard: boolean,
    cardToken?: string,
    cardData?: CardData
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

export default CheckoutPage;

