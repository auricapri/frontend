/**
 * Confirmation Stage - For pending orders
 */
import React from 'react';
import { AlertOctagon } from 'lucide-react';
import type { ConfirmationStageProps } from '../types';

export const ConfirmationStage: React.FC<ConfirmationStageProps> = ({
  onApprove,
  onReject,
}) => {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-xl space-y-6">
      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
        <AlertOctagon className="w-4 h-4" /> Ação Necessária
      </h5>
      <p className="text-sm font-medium text-neutral-600">
        Este pedido aguarda confirmação de estoque e pagamento. Aprovar moverá para
        expedição.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onApprove}
          className="py-4 bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg"
        >
          Confirmar Pedido
        </button>
        <button
          onClick={onReject}
          className="py-4 bg-red-100 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-all"
        >
          Rejeitar & Reembolsar
        </button>
      </div>
    </div>
  );
};
