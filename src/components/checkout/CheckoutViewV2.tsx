import React from 'react';
import { ArrowLeft, CreditCard, MapPin, ShieldCheck, Loader2 } from 'lucide-react';
import { type AddressData, type CartItem, type InternalLogisticsInfo, type Product, type StoreConfig, type UserMode, type UserProfile } from '../../types';
import { type Locale } from '../../i18n';
import { type PaymentMethod } from '../../constants/enums';
import { useCheckoutState } from './hooks/useCheckoutState';

// Lazy load checkout steps para melhor performance
// AddressStep carrega mapas (Leaflet ~300KB), PaymentStep carrega Stripe (~200KB)
const AddressStep = React.lazy(() => import('./steps/AddressStep').then(m => ({ default: m.AddressStep })));
const PaymentStep = React.lazy(() => import('./steps/PaymentStep').then(m => ({ default: m.PaymentStep })));
const ReviewStep = React.lazy(() => import('./steps/ReviewStep').then(m => ({ default: m.ReviewStep })));
const CheckoutSidebar = React.lazy(() => import('./CheckoutSidebar').then(m => ({ default: m.CheckoutSidebar })));

interface CheckoutViewProps {
  items: CartItem[];
  currentUser: UserProfile | null;
  storeConfig?: StoreConfig;
  userMode: UserMode;
  onBack: () => void;
  onComplete: (
    address: AddressData,
    logistics: InternalLogisticsInfo,
    paymentMethod: PaymentMethod,
    finalAmount: number,
    saveCard: boolean,
    cardToken?: string,
    phone?: string
  ) => void;
  locale: Locale;
  t: (key: string) => string;
  initialStep?: number;
  giftDeliveryLocation?: string;
  products?: Product[];
}

const steps = [
  { id: 1, title: 'Endereço', shortTitle: 'End.', icon: MapPin },
  { id: 2, title: 'Pagamento', shortTitle: 'Pag.', icon: CreditCard },
  { id: 3, title: 'Revisão', shortTitle: 'Rev.', icon: ShieldCheck },
] as const;

const CheckoutView: React.FC<CheckoutViewProps> = ({ items, currentUser, storeConfig, userMode, onBack, onComplete, locale, t: _t, initialStep, giftDeliveryLocation, products }) => {
  const checkout = useCheckoutState({ items, currentUser, storeConfig, userMode, onComplete, locale, initialStep, products });

  return (
    <div className="min-h-screen bg-paper text-neutral-900 flex flex-col pt-16 pb-12 relative">
      <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-3 text-[10px] font-normal uppercase tracking-widest text-neutral-400 hover:text-black transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar à Loja
            </button>
            <h1 className="text-4xl font-normal tracking-tighter uppercase">Finalizar Pedido</h1>
            {giftDeliveryLocation && (
              <p className="mt-2 text-[10px] font-normal uppercase tracking-widest text-neutral-500">
                Presente para: <span className="text-black">{giftDeliveryLocation}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-10">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    checkout.step >= s.id ? 'bg-black text-white border-black' : 'border-neutral-100 text-neutral-500'
                  }`}
                >
                  <s.icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-normal uppercase tracking-widest ${
                    checkout.step >= s.id ? 'text-black' : 'text-neutral-500'
                  }`}
                >
                  <span className="hidden lg:inline">{s.title}</span>
                  <span className="lg:hidden">{s.shortTitle}</span>
                </span>
                {idx < steps.length - 1 && <div className="hidden lg:block w-8 h-[1px] bg-neutral-100" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            <React.Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
              </div>
            }>
              {checkout.step === 1 && <AddressStep checkout={checkout} />}
              {checkout.step === 2 && <PaymentStep checkout={checkout} />}
              {checkout.step === 3 && <ReviewStep checkout={checkout} />}
            </React.Suspense>
          </div>

          <React.Suspense fallback={
            <div className="lg:col-span-5 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          }>
            <CheckoutSidebar checkout={checkout} />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;
