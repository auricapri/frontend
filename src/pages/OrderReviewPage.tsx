import React from 'react';
import { OrderProductReviewPage } from './OrderProductReviewPage';
import { Locale } from '../i18n';

interface OrderReviewPageProps {
  orderId: string;
  onBack?: () => void;
  t: (key: string) => any;
  locale: Locale;
  storeConfig?: any; // allow: pragmatic any
}

export const OrderReviewPage: React.FC<OrderReviewPageProps> = (props) => {
  return <OrderProductReviewPage {...props} />;
};
