import React from 'react';
import { CheckoutView, AddressData } from '../components/checkout';
import { CartItem, InternalLogisticsInfo, UserProfile, StoreConfig } from '../types';
import { Locale } from '../i18n';

interface CheckoutPageProps {
  items: CartItem[];
  currentUser: UserProfile | null;
  storeConfig?: StoreConfig;
  onBack: () => void;
  onComplete: (
    address: AddressData,
    logistics: InternalLogisticsInfo,
    paymentMethod: 'credit_card' | 'pix',
    finalAmount: number,
    saveCard: boolean,
    cardToken?: string
  ) => void;
  t: (key: string) => any;
  locale: Locale;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  currentUser,
  storeConfig,
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
      onBack={onBack} 
      onComplete={onComplete} 
      locale={locale} 
      t={t} 
    />
  );
};

