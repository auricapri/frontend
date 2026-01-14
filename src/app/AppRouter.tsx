import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { DeliveryLoginPage } from '../pages/DeliveryLoginPage';
import { AboutUs } from '../components/shared';
import { type Order, type StoreConfig } from '../types';
import { AppLayout } from './AppLayout';

const AdminDashboard = React.lazy(() => import('../components/admin/AdminDashboard'));
const AdminDelivery = React.lazy(() => import('../components/admin/AdminDelivery'));
const OrderReceipt = React.lazy(() => import('../components/orders/OrderReceipt'));
const SharedWishlistPage = React.lazy(() => import('../pages/SharedWishlistPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
    </div>
  );
}

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
    return <NotFoundPage locale={app.locale} onNavigate={app.onNavigate} t={app.t} />;
  }

  if (app.currentView === 'reset-password') {
    return <ResetPasswordPage locale={app.locale} onNavigate={app.onNavigate} t={app.t} />;
  }

  if (app.currentView === 'admin-login') {
    return (
      <AdminLoginPage
        onLoginSuccess={() => {
          onSetCurrentView('admin');
          window.history.pushState({ view: 'admin' }, '', '/admin');
        }}
        t={app.t}
        locale={app.locale}
      />
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
      <DeliveryLoginPage
        onLoginSuccess={() => {
          onSetCurrentView('delivery');
          window.history.pushState({ view: 'delivery' }, '', '/admin/delivery');
        }}
        t={app.t}
        locale={app.locale}
      />
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
    return <AboutUs config={storeConfig} locale={app.locale} onBack={() => app.onNavigate('home')} />;
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
