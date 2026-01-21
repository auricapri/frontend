import React, { Suspense } from 'react';
import { type Order, type StoreConfig } from '../types';
import { AppLayout } from './AppLayout';
import { LoadingFallback } from '../components/ui';

// Lazy load páginas para melhor performance
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ResetPasswordPage = React.lazy(() => import('../pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const AdminLoginPage = React.lazy(() => import('../pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const DeliveryLoginPage = React.lazy(() => import('../pages/DeliveryLoginPage').then(m => ({ default: m.DeliveryLoginPage })));
const PrivacyPolicyPage = React.lazy(() => import('../pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = React.lazy(() => import('../pages/TermsPage').then(m => ({ default: m.TermsPage })));
const AboutUs = React.lazy(() => import('../components/shared/AboutUs'));
const AdminDashboard = React.lazy(() => import('../components/admin/AdminDashboard'));
const AdminDelivery = React.lazy(() => import('../components/admin/AdminDelivery'));
const OrderReceipt = React.lazy(() => import('../components/orders/OrderReceipt'));
const SharedWishlistPage = React.lazy(() => import('../pages/SharedWishlistPage'));
const SearchResultsPage = React.lazy(() => import('../pages/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })));

export function AppRouter(props: {
  app: any;
  storeConfig: StoreConfig;
  lastSuccessOrder: Order | null;
  userOrders: Order[];
  onExitAdmin: () => void;
  onSignOut: () => Promise<any>;
  onSetCurrentView: (v: any) => void;
}) {
  const { app, storeConfig, lastSuccessOrder, userOrders, onExitAdmin, onSignOut, onSetCurrentView } = props;

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

  if (app.currentView === 'admin-login') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminLoginPage
          onLoginSuccess={() => {
            onSetCurrentView('admin');
            window.history.pushState({ view: 'admin' }, '', '/admin');
          }}
          t={app.t}
          locale={app.locale}
        />
      </Suspense>
    );
  }

  if (app.currentView === 'admin') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminDashboard onLogout={onExitAdmin} t={app.t} locale={app.locale} onProductChange={app.onRefetchStoreData} />
      </Suspense>
    );
  }

  if (app.currentView === 'delivery-login') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <DeliveryLoginPage
          onLoginSuccess={() => {
            onSetCurrentView('delivery');
            window.history.pushState({ view: 'delivery' }, '', '/admin/delivery');
          }}
          t={app.t}
          locale={app.locale}
        />
      </Suspense>
    );
  }

  if (app.currentView === 'delivery') {
    return (
      <div className="h-screen bg-neutral-50 flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-6 md:pt-8 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black uppercase">Delivery Dashboard</h1>
            <button
              onClick={async () => {
                await onSignOut();
                onSetCurrentView('delivery-login');
                window.history.pushState({ view: 'delivery-login' }, '', '/admin/login/delivery');
              }}
              className="px-4 py-2 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-neutral-800 active:scale-[0.99] transition-all"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full h-full px-4 md:px-8 pb-8">
            <div className="h-full overflow-y-auto">
              <Suspense fallback={<LoadingFallback />}>
                <AdminDelivery orders={userOrders} suppliers={[]} locale={app.locale} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (app.currentView === 'receipt' && lastSuccessOrder) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <OrderReceipt order={lastSuccessOrder} onBack={() => app.onNavigate('home')} t={app.t} locale={app.locale} />
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
