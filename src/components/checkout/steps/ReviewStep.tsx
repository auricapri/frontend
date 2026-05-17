import React, { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { type CheckoutState } from '../hooks/useCheckoutState';

export function ReviewStep({ checkout }: { checkout: CheckoutState }) {
  const {
    setStep,
    paymentMethod: _paymentMethod,
    paymentProcessing,
    completeOrderWithPayment,
    pixError,
    boletoError,
    creditCardError,
  } = checkout;

  // isSubmitting is set synchronously on the very first click, before any async work,
  // closing the race window that existed with paymentProcessing (which was only set
  // after the async call started). This prevents double-submission on all payment paths.
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmOrder = async () => {
    // Synchronous guard — blocks any second click before React re-renders
    if (isSubmitting || paymentProcessing) return;
    setIsSubmitting(true);

    try {
      // All payment methods go through completeOrderWithPayment:
      // - PIX/Boleto: creates order → generates QR/boleto → redirects to step 2
      // - Credit card: creates order → charges Asaas → shows success overlay
      await completeOrderWithPayment();
    } catch (error) {
      console.error('Error completing order:', error);
      // Error is already set in the state by completeOrderWithPayment;
      // release the lock so the user can retry.
      setIsSubmitting(false);
    }
  };
  const error = pixError || boletoError || creditCardError;

  return (
    <section className="space-y-12 animate-in fade-in slide-in-from-left duration-700 text-center py-20 bg-paper/50 rounded-[4rem] border border-dashed border-neutral-200">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center mb-10 shadow-2xl">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h3 className="text-3xl font-normal uppercase tracking-tighter mb-4">Finalização Segura</h3>
        <p className="text-sm text-neutral-600 max-w-md mx-auto mb-8 leading-relaxed">
          Seu pedido passará por uma análise de segurança automática e será despachado em até 24h úteis.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 max-w-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-4 w-full max-w-sm px-4">
          <button
            onClick={() => setStep(2)}
            disabled={isSubmitting}
            className="flex-1 px-8 py-6 border border-neutral-200 rounded-[2rem] text-xs font-normal uppercase tracking-widest hover:bg-neutral-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Editar
          </button>
          <button
            onClick={handleConfirmOrder}
            disabled={isSubmitting}
            className="flex-[2] py-8 bg-black text-white rounded-[2rem] text-[11px] font-normal uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.05] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>PROCESSANDO...</span>
              </>
            ) : (
              'CONCLUIR COMPRA'
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
