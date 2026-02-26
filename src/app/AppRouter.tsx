import React, { Suspense } from 'react';
import { type Order, type StoreConfig } from '../types';
import { AppLayout } from './AppLayout';
import { LoadingFallback } from '../components/ui';

const DeliveryLoginPage = React.lazy(() => import('../pages/DeliveryLoginPage').then(m => ({ default: m.DeliveryLoginPage })));
const DeliveryDashboard = React.lazy(() => import('../components/delivery/DeliveryDashboard'));

// Lazy load páginas para melhor performance
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ResetPasswordPage = React.lazy(() => import('../pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const PrivacyPolicyPage = React.lazy(() => import('../pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = React.lazy(() => import('../pages/TermsPage').then(m => ({ default: m.TermsPage })));
const ShippingReturnsPage = React.lazy(() => import('../pages/ShippingReturnsPage').then(m => ({ default: m.ShippingReturnsPage })));
const AboutUs = React.lazy(() => import('../components/shared/AboutUs'));
const OrderReceipt = React.lazy(() => import('../components/orders/OrderReceipt'));
const SharedWishlistPage = React.lazy(() => import('../pages/SharedWishlistPage'));
const SearchResultsPage = React.lazy(() => import('../pages/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })));
const MyReturnsPage = React.lazy(() => import('../pages/MyReturnsPage').then(m => ({ default: m.MyReturnsPage })));
const ReturnRequestForm = React.lazy(() => import('../components/returns/ReturnRequestForm'));
const AffiliatePage = React.lazy(() => import('../pages/AffiliatePage').then(m => ({ default: m.AffiliatePage })));

export function AppRouter(props: {
  app: any;
  storeConfig: StoreConfig;
  lastSuccessOrder: Order | null;
  onSignOut: () => Promise<any>;
  onSetCurrentView: (v: any) => void;
}) {
  const { app, storeConfig, lastSuccessOrder, onSignOut, onSetCurrentView } = props;

  if (app.currentView === '404') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <NotFoundPage locale={app.locale} onNavigate={app.onNavigate} t={app.t} />
      </Suspense>
    );
  }

  if (app.currentView === 'reset-password') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ResetPasswordPage locale={app.locale} onNavigate={app.onNavigate} t={app.t} />
      </Suspense>
    );
  }

  if (app.currentView === 'admin-login' || app.currentView === 'admin' ||
      app.currentView === 'marketplace-callback') {
    window.location.href = 'https://admin.auricapri.com.br';
    return <LoadingFallback />;
  }

  if (app.currentView === 'delivery-login') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <DeliveryLoginPage
          onLoginSuccess={() => {
            window.history.pushState({ view: 'delivery' }, '', '/delivery');
            onSetCurrentView('delivery');
          }}
          t={app.t}
          locale={app.locale}
        />
      </Suspense>
    );
  }

  if (app.currentView === 'delivery') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <DeliveryDashboard
          locale={app.locale}
          onLogout={async () => {
            await onSignOut();
            window.history.pushState({ view: 'delivery-login' }, '', '/delivery-login');
            onSetCurrentView('delivery-login');
          }}
        />
      </Suspense>
    );
  }

  if (app.currentView === 'receipt' && lastSuccessOrder) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <OrderReceipt order={lastSuccessOrder} onBack={() => app.onNavigate('home')} t={app.t} locale={app.locale} taxId={storeConfig?.tax_id} />
      </Suspense>
    );
  }

  if (app.currentView === 'about') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AboutUs config={storeConfig} locale={app.locale} onBack={() => app.onNavigate('home')} />
      </Suspense>
    );
  }

  if (app.currentView === 'privacy') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PrivacyPolicyPage config={storeConfig} locale={app.locale} onBack={() => app.onNavigate('home')} />
      </Suspense>
    );
  }

  if (app.currentView === 'terms') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <TermsPage config={storeConfig} locale={app.locale} onBack={() => app.onNavigate('home')} />
      </Suspense>
    );
  }

  if (app.currentView === 'shipping') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ShippingReturnsPage locale={app.locale} onBack={() => app.onNavigate('home')} onNavigateReturns={() => app.onNavigate('request-return')} />
      </Suspense>
    );
  }

  if (app.currentView === 'my-returns') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <MyReturnsPage
          locale={app.locale}
          onBack={() => app.onNavigate('home')}
          onRequestReturn={() => app.onNavigate('request-return')}
        />
      </Suspense>
    );
  }

  if (app.currentView === 'request-return') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ReturnRequestForm
          locale={app.locale}
          onBack={() => app.onNavigate('my-returns')}
          onSuccess={() => {}}
        />
      </Suspense>
    );
  }

  if (app.currentView === 'affiliates') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AffiliatePage locale={app.locale} onBack={() => app.onNavigate('home')} />
      </Suspense>
    );
  }

  if (app.currentView === 'shared-wishlist') {
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];
    return (
      <Suspense fallback={<LoadingFallback />}>
        <SharedWishlistPage locale={app.locale} t={app.t} userMode={app.userMode} currentUser={app.currentUser} onNavigate={app.onNavigate} slug={slug} />
      </Suspense>
    );
  }

  return <AppLayout app={app} />;
}
