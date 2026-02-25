import React, { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { PaymentMethod } from '../../../constants/enums';
import { type CheckoutState } from '../hooks/useCheckoutState';

export function ReviewStep({ checkout }: { checkout: CheckoutState }) {
  const {
    setStep,
    payment,
    paymentMethod,
    paymentProcessing,
    completeOrderWithPayment,
    pixError,
    boletoError
  } = checkout;

  // Local flag to prevent double-submission on credit card path.
  // For PIX/Boleto, paymentProcessing (from usePixBoletoState) already handles this.
  // For credit card, handleCompleteOrder() is synchronous and triggers isProcessingOrder
  // in the parent app layer — by the time the UI re-renders the button is already clickable again.
  const [creditCardSubmitted, setCreditCardSubmitted] = useState(false);

  const handleConfirmOrder = async () => {
    // Prevent any re-entrancy regardless of payment method
    if (paymentProcessing || creditCardSubmitted) return;

    if (paymentMethod === PaymentMethod.PIX || paymentMethod === PaymentMethod.BOLETO) {
      try {
        await completeOrderWithPayment();
        // The function will redirect to step 2 to show QR code / boleto
      } catch (error) {
        console.error('Error completing order:', error);
        // Error is already set in the state by completeOrderWithPayment
      }
    } else {
      // Credit card: lock the button immediately to prevent double-click.
      // The parent app layer (AppLayout) shows isProcessingOrder overlay,
      // but there is a render gap between click and that overlay appearing.
      setCreditCardSubmitted(true);
      payment.handleCompleteOrder();
    }
  };

  const isSubmitting = paymentProcessing || creditCardSubmitted;
  const error = pixError || boletoError;

  return (
    <section className="space-y-12 animate-in fade-in slide-in-from-left duration-700 text-center py-20 bg-neutral-50/50 rounded-[4rem] border border-dashed border-neutral-200">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center mb-10 shadow-2xl">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Finalização Segura</h3>
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
            className="flex-1 px-8 py-6 border border-neutral-200 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-neutral-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Editar
          </button>
          <button
            onClick={handleConfirmOrder}
            disabled={isSubmitting}
            className="flex-[2] py-8 bg-black text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.05] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
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
