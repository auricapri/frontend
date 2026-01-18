import React from 'react';
import { ArrowLeft, CreditCard, MapPin, ShieldCheck } from 'lucide-react';
import { type AddressData, type CartItem, type InternalLogisticsInfo, type StoreConfig, type UserMode, type UserProfile } from '../../types';
import { type Locale } from '../../i18n';
import { type PaymentMethod } from '../../constants/enums';
import { useCheckoutState } from './hooks/useCheckoutState';
import { AddressStep } from './steps/AddressStep';
import { PaymentStep } from './steps/PaymentStep';
import { ReviewStep } from './steps/ReviewStep';
import { CheckoutSidebar } from './CheckoutSidebar';

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
}

const steps = [
  { id: 1, title: 'Endereço', icon: MapPin },
  { id: 2, title: 'Pagamento', icon: CreditCard },
  { id: 3, title: 'Revisão', icon: ShieldCheck },
] as const;

const CheckoutView: React.FC<CheckoutViewProps> = ({ items, currentUser, storeConfig, userMode, onBack, onComplete, locale, t: _t }) => {
  const checkout = useCheckoutState({ items, currentUser, storeConfig, userMode, onComplete, locale });

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col pt-24 pb-20 relative">
      <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar à Loja
            </button>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Finalizar Pedido</h1>
          </div>
          <div className="flex items-center gap-10">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    checkout.step >= s.id ? 'bg-black text-white border-black' : 'border-neutral-100 text-neutral-300'
                  }`}
                >
                  <s.icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest hidden lg:block ${
                    checkout.step >= s.id ? 'text-black' : 'text-neutral-300'
                  }`}
                >
                  {s.title}
                </span>
                {idx < steps.length - 1 && <div className="hidden lg:block w-8 h-[1px] bg-neutral-100" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-7 space-y-16">
            {checkout.step === 1 && <AddressStep checkout={checkout} />}
            {checkout.step === 2 && <PaymentStep checkout={checkout} />}
            {checkout.step === 3 && <ReviewStep checkout={checkout} />}
          </div>

          <CheckoutSidebar checkout={checkout} />
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;
