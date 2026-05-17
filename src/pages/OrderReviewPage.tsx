import React from 'react';
import { OrderProductReviewPage } from './OrderProductReviewPage';
import { Locale } from '../i18n';
import type { StoreConfig } from '../types';

interface OrderReviewPageProps {
  orderId: string;
  onBack?: () => void;
  t: (key: string) => string;
  locale: Locale;
  storeConfig?: StoreConfig;
}

export const OrderReviewPage: React.FC<OrderReviewPageProps> = (props) => {
  return <OrderProductReviewPage {...props} />;
};
