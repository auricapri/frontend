import React from 'react';
import { OrderReceipt } from '../components/orders';
import { Order } from '../types';
import { Locale } from '../i18n';

interface ReceiptPageProps {
  order: Order;
  onBack: () => void;
  t: (key: string) => any;
  locale: Locale;
}

export const ReceiptPage: React.FC<ReceiptPageProps> = ({
  order,
  onBack,
  t,
  locale
}) => {
  return (
    <OrderReceipt 
      order={order} 
      onBack={onBack} 
      t={t} 
      locale={locale} 
    />
  );
};

