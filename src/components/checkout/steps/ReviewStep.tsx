import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { type CheckoutState } from '../hooks/useCheckoutState';

export function ReviewStep({ checkout }: { checkout: CheckoutState }) {
  const { setStep, payment } = checkout;

  return (
    <section className="space-y-12 animate-in fade-in slide-in-from-left duration-700 text-center py-20 bg-neutral-50/50 rounded-[4rem] border border-dashed border-neutral-200">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center mb-10 shadow-2xl">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Finalização Segura</h3>
        <p className="text-sm text-neutral-400 max-w-md mx-auto mb-12 leading-relaxed">
          Seu pedido passará por uma análise de segurança automática e será despachado em até 24h úteis.
        </p>
        <div className="flex gap-4 w-full max-w-sm px-4">
          <button
            onClick={() => setStep(2)}
            className="flex-1 px-8 py-6 border border-neutral-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all"
          >
            Editar
          </button>
          <button
            onClick={payment.handleCompleteOrder}
            className="flex-[2] py-8 bg-black text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.05] transition-all active:scale-95"
          >
            CONCLUIR COMPRA
          </button>
        </div>
      </div>
    </section>
  );
}

