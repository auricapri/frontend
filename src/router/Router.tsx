import React from 'react';
import { View } from './routes';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CollectionPage } from '../pages/CollectionPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { AdminPage } from '../pages/AdminPage';
import { AboutPage } from '../pages/AboutPage';
import { ReceiptPage } from '../pages/ReceiptPage';
import { OrderReviewPage } from '../pages/OrderReviewPage';

interface RouterProps {
  currentView: View;
  // HomePage props
  homeProps?: any;
  // ProductPage props
  productProps?: any;
  // CollectionPage props
  collectionProps?: any;
  // CheckoutPage props
  checkoutProps?: any;
  // AdminPage props
  adminProps?: any;
  // AboutPage props
  aboutProps?: any;
  // ReceiptPage props
  receiptProps?: any;
  // OrderReviewPage props
  orderReviewProps?: any;
}

export const Router: React.FC<RouterProps> = ({
  currentView,
  homeProps,
  productProps,
  collectionProps,
  checkoutProps,
  adminProps,
  aboutProps,
  receiptProps,
  orderReviewProps
}) => {
  switch (currentView) {
    case 'home':
      return homeProps ? <HomePage {...homeProps} /> : null;
    case 'product':
      return productProps ? <ProductPage {...productProps} /> : null;
    case 'collection':
      return collectionProps ? <CollectionPage {...collectionProps} /> : null;
    case 'checkout':
      return checkoutProps ? <CheckoutPage {...checkoutProps} /> : null;
    case 'admin':
      return adminProps ? <AdminPage {...adminProps} /> : null;
    case 'about':
      return aboutProps ? <AboutPage {...aboutProps} /> : null;
    case 'receipt':
      return receiptProps ? <ReceiptPage {...receiptProps} /> : null;
    case 'order-review':
      return orderReviewProps ? <OrderReviewPage {...orderReviewProps} /> : null;
    default:
      return null;
  }
};

