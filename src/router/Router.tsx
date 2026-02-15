import React from 'react';
import { View } from './routes';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CollectionPage } from '../pages/CollectionPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { AboutPage } from '../pages/AboutPage';
import { ReceiptPage } from '../pages/ReceiptPage';
import { OrderReviewPage } from '../pages/OrderReviewPage';
import {
  HomePageProps,
  ProductPageProps,
  CollectionPageProps,
  CheckoutPageProps,
  AboutPageProps,
  ReceiptPageProps,
  OrderReviewPageProps
} from '../types/router-props';

interface RouterProps {
  currentView: View;
  homeProps?: HomePageProps;
  productProps?: ProductPageProps;
  collectionProps?: CollectionPageProps;
  checkoutProps?: CheckoutPageProps;
  aboutProps?: AboutPageProps;
  receiptProps?: ReceiptPageProps;
  orderReviewProps?: OrderReviewPageProps;
}

export const Router: React.FC<RouterProps> = ({
  currentView,
  homeProps,
  productProps,
  collectionProps,
  checkoutProps,
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

