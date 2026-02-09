/**
 * Expedition Stage - Document generation and dispatch
 */
import React from 'react';
import { Truck, Printer, Barcode, Lock, CheckCircle2 } from 'lucide-react';
import type { ExpeditionStageProps } from '../types';

export const ExpeditionStage: React.FC<ExpeditionStageProps> = ({
  order,
  logistics,
  isDocGenerated,
  isGeneratingLabel,
  trackingInput,
  onTrackingChange,
  onGenerateDoc,
  onDispatch,
}) => {
  return (
    <div className="space-y-6">
      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center gap-2">
        <Truck className="w-3 h-3" /> Fluxo de Expedição
      </h5>

      {/* STEP 1: Generate Document */}
      <div
        className={`p-6 rounded-[2.5rem] border transition-all ${
          isDocGenerated
            ? 'bg-green-50 border-green-200'
            : 'bg-white border-neutral-200 shadow-xl'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isDocGenerated ? 'bg-green-500 text-white' : 'bg-black text-white'
              }`}
            >
              1
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              Etiqueta de Envio
            </span>
          </div>
          {isDocGenerated && <CheckCircle2 className="w-5 h-5 text-green-600" />}
        </div>

        {!isDocGenerated ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-[10px] bg-neutral-50 p-4 rounded-xl">
              <div>
                <span className="text-neutral-400 block">Peso Calc.</span>
                <span className="font-bold">{logistics.totalWeight}g</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Dimensões Est.</span>
                <span className="font-bold">{logistics.dimensions} cm</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Transportadora</span>
                <span className="font-bold">
                  {order.internal_logistics?.selected_carrier}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Prazo Cliente</span>
                <span className="font-bold">
                  {order.internal_logistics?.display_days_was} dias
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Prazo Real</span>
                <span className="font-bold text-blue-600">
                  {order.internal_logistics?.estimated_days} dias
                </span>
              </div>
            </div>
            <button
              onClick={onGenerateDoc}
              disabled={isGeneratingLabel}
              className="w-full py-4 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> Gerar & Baixar PDF
            </button>
          </div>
        ) : (
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-dashed border-neutral-300">
              <Barcode className="w-6 h-6 text-neutral-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-green-700">Documento Anexado</p>
              <button
                onClick={onGenerateDoc}
                disabled={isGeneratingLabel}
                className="text-[9px] underline disabled:opacity-50"
              >
                {isGeneratingLabel ? 'Gerando etiqueta...' : 'Baixar novamente'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: Input Tracking & Dispatch */}
      <div
        className={`p-6 rounded-[2.5rem] border transition-all ${
          !isDocGenerated
            ? 'opacity-50 grayscale pointer-events-none bg-neutral-50 border-neutral-100'
            : 'bg-white border-neutral-200 shadow-xl'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-xs text-neutral-500">
              2
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              Rastreio & Envio
            </span>
          </div>
          {!isDocGenerated && <Lock className="w-4 h-4 text-neutral-300" />}
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              className="flex-1 p-4 bg-neutral-50 border border-neutral-200 rounded-2xl font-mono text-sm font-bold uppercase outline-none focus:border-black transition-all"
              placeholder="CÓDIGO RASTREIO"
              value={trackingInput}
              onChange={(e) => onTrackingChange(e.target.value.toUpperCase())}
              disabled={!isDocGenerated}
            />
            <button
              onClick={onDispatch}
              disabled={!isDocGenerated || !trackingInput}
              className="px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              Marcar Enviado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
