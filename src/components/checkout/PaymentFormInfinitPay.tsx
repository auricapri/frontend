import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { UserProfile } from '../../types';
import { Locale } from '../../i18n';
import { InfinitPayApi } from '../../api/infinitpay.api';

interface PaymentFormInfinitPayProps {
  currentUser: UserProfile | null;
  amount: number;
  description: string;
  items: any[];
  addressData: any;
  logisticsInfo: any;
  subtotal: number;
  locale: Locale;
  onBack: () => void;
  onError: (error: string) => void;
  onPaymentLinkCreated: (orderId: string, checkoutUrl: string) => void;
}

export const PaymentFormInfinitPay: React.FC<PaymentFormInfinitPayProps> = ({
  currentUser,
  amount,
  description,
  items,
  addressData,
  logisticsInfo,
  subtotal,
  locale,
  onBack,
  onError,
  onPaymentLinkCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const infinitPayApi = new InfinitPayApi();

  useEffect(() => {
    const createPaymentLink = async () => {
      if (!currentUser) {
        setError('Usuário não autenticado');
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        setError('Nenhum item no carrinho');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('PaymentFormInfinitPay - items received:', items);
        console.log('PaymentFormInfinitPay - items is array?', Array.isArray(items));
        console.log('PaymentFormInfinitPay - items length:', items?.length);

        const customer = {
          name: currentUser.full_name || currentUser.email || 'Cliente',
          email: currentUser.email || '',
          document: currentUser.document || undefined,
          phone: currentUser.phone || undefined,
        };

        const response = await infinitPayApi.createPaymentLink({
          amount,
          description,
          customer,
          items,
          addressData,
          logisticsInfo,
          subtotal,
        });

        console.log('PaymentFormInfinitPay - response received:', response);
        console.log('PaymentFormInfinitPay - checkout_url:', response.checkout_url);

        if (!response.checkout_url) {
          throw new Error('Link de pagamento não foi retornado pela API');
        }

        onPaymentLinkCreated(response.order_id, response.checkout_url);
        
        setTimeout(() => {
          if (response.checkout_url) {
            console.log('PaymentFormInfinitPay - redirecting to:', response.checkout_url);
            window.location.href = response.checkout_url;
          }
        }, 500);
      } catch (err: any) {
        const errorMessage = err.message || 'Erro ao criar link de pagamento';
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    createPaymentLink();
  }, []);

  return (
    <section className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
      <div className="flex items-center gap-6 mb-10">
        <div className="p-4 bg-neutral-50 rounded-2xl">
          <CreditCard className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black uppercase italic tracking-tighter">Pagamento InfinitPay</h3>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <Loader2 className="w-12 h-12 animate-spin text-black" />
          <div className="text-center space-y-2">
            <p className="text-sm font-black uppercase tracking-widest">Processando Pagamento</p>
            <p className="text-xs text-neutral-400">Aguarde enquanto preparamos seu link de pagamento...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 space-y-4">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h4 className="text-sm font-black uppercase tracking-widest text-red-900">Erro no Pagamento</h4>
          </div>
          <p className="text-xs text-red-700">{error}</p>
          <div className="flex gap-4 pt-4">
            <button
              onClick={onBack}
              className="px-10 py-6 border border-red-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-red-700 hover:bg-red-100 transition-all"
            >
              Voltar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-10 py-6 bg-red-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-neutral-50 rounded-[2.5rem] p-10 space-y-6 text-center">
          <div className="flex items-center justify-center gap-4">
            <ExternalLink className="w-5 h-5 text-neutral-400" />
            <p className="text-xs font-black uppercase tracking-widest text-neutral-600">
              Redirecionando para o pagamento...
            </p>
          </div>
        </div>
      )}

      {!loading && (
        <div className="flex gap-4 pt-12">
          <button
            onClick={onBack}
            disabled={loading}
            className="px-10 py-6 border border-neutral-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all disabled:opacity-20"
          >
            Voltar
          </button>
        </div>
      )}
    </section>
  );
};

