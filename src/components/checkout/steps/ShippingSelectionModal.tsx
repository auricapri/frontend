import { useCallback, useState } from 'react';
import { Check, Loader2, MapPin, Truck, X, Zap } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import type { InternalLogisticsInfo } from '../../../types';
import type { ShippingOption } from '../../../services/logistics.service';
import type { Locale } from '../../../i18n';

type ShippingChoice = 'free' | 'express' | { carrier: ShippingOption };
type ModalTab = 'address' | 'shipping';

const isCarrierChoice = (s: ShippingChoice): s is { carrier: ShippingOption } =>
  s !== 'free' && s !== 'express';

interface ShippingSelectionModalProps {
  freeOption: InternalLogisticsInfo | null;
  freeDisplayDays: number;
  freeDisplayPrice: number;
  expressOption: InternalLogisticsInfo | null;
  carrierOptions: ShippingOption[];
  locale: Locale;
  isCalculating: boolean;
  onSelectFree: () => void;
  onSelectExpress: () => void;
  onSelectCarrier: (opt: ShippingOption) => void;
  onConfirm: () => void;
  onClose: () => void;
  addressLine1: string;
  addressLine2: string;
  cep?: string;
  onAddressConfirmed: () => void;
}

export function ShippingSelectionModal({
  freeOption,
  freeDisplayDays,
  freeDisplayPrice: _freeDisplayPrice,
  expressOption,
  carrierOptions,
  locale,
  isCalculating,
  onSelectFree,
  onSelectExpress,
  onSelectCarrier,
  onConfirm,
  onClose,
  addressLine1,
  addressLine2,
  cep,
  onAddressConfirmed,
}: ShippingSelectionModalProps) {
  const [selected, setSelected] = useState<ShippingChoice>('free');
  const [tab, setTab] = useState<ModalTab>('address');

  const handleAddressConfirm = useCallback(() => {
    onAddressConfirmed();
    setTab('shipping');
  }, [onAddressConfirmed]);

  const handleShippingConfirm = useCallback(() => {
    if (selected === 'free') {
      onSelectFree();
    } else if (selected === 'express') {
      onSelectExpress();
    } else {
      onSelectCarrier(selected.carrier);
    }
    onConfirm();
  }, [selected, onSelectFree, onSelectExpress, onSelectCarrier, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-paper rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 md:mx-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-xl">
              {tab === 'address'
                ? <MapPin className="w-5 h-5 text-white" />
                : <Truck className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-base font-normal uppercase tracking-tight">
                {tab === 'address' ? 'Confirmar Endereço' : 'Escolher Entrega'}
              </h3>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">
                {tab === 'address' ? 'Passo 1 de 2' : 'Passo 2 de 2'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-xl transition-all">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Step progress bar */}
        <div className="flex gap-1.5 mb-6">
          <div className="h-1 flex-1 rounded-full bg-black" />
          <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${tab === 'shipping' ? 'bg-black' : 'bg-neutral-200'}`} />
        </div>

        {tab === 'address' ? (
          <>
            <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-normal text-neutral-900 leading-snug">{addressLine1}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{addressLine2}</p>
                  {cep && <p className="text-xs text-neutral-400 mt-1">CEP {cep}</p>}
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-400 text-center mb-5 leading-relaxed">
              Verifique se o endereço está correto antes de continuar.
              Sua confirmação será registrada.
            </p>

            <button
              onClick={handleAddressConfirm}
              className="w-full py-4 bg-black text-white rounded-2xl text-xs font-normal uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.01] transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              Endereço Correto — Continuar
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-xs text-neutral-400 uppercase tracking-widest mt-1 hover:text-neutral-700 transition-colors"
            >
              Preciso corrigir o endereço
            </button>
          </>
        ) : (
          <>
            {isCalculating ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                <p className="text-xs font-normal uppercase tracking-widest text-neutral-500">Calculando opções...</p>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {freeOption && (
                  <button
                    onClick={() => setSelected('free')}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                      selected === 'free' ? 'border-black bg-black text-white' : 'border-neutral-100 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-normal uppercase tracking-tight">Frete Grátis</div>
                        <div className={`text-xs mt-0.5 ${selected === 'free' ? 'text-white/60' : 'text-neutral-500'}`}>
                          {freeDisplayDays} dias úteis (PAC)
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selected === 'free' && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                        <div className={`text-sm font-normal ${selected === 'free' ? 'text-green-400' : 'text-green-600'}`}>
                          GRÁTIS
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {expressOption && (
                  <button
                    onClick={() => setSelected('express')}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                      selected === 'express' ? 'border-black bg-black text-white' : 'border-neutral-100 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className={`text-sm font-normal uppercase tracking-tight flex items-center gap-2 ${selected === 'express' ? 'text-white' : ''}`}>
                          <Zap className={`w-3.5 h-3.5 shrink-0 ${selected === 'express' ? 'text-blue-400' : 'text-blue-500'}`} />
                          Expresso
                          <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded uppercase tracking-widest ${
                            selected === 'express' ? 'bg-blue-400/20 text-blue-300' : 'bg-blue-50 text-blue-600'
                          }`}>Mais Rápido</span>
                        </div>
                        <div className={`text-xs mt-0.5 ${selected === 'express' ? 'text-white/60' : 'text-neutral-500'}`}>
                          {expressOption.estimated_days} {expressOption.estimated_days === 1 ? 'dia útil' : 'dias úteis'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selected === 'express' && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                        <span className={`text-sm font-normal ${selected === 'express' ? 'text-white' : ''}`}>
                          {formatCurrency(expressOption.real_cost, locale)}
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {carrierOptions.map((opt, idx) => {
                  const isSelected = isCarrierChoice(selected) &&
                    selected.carrier.method === opt.method &&
                    selected.carrier.provider === opt.provider;
                  const isFastest = opt.estimated_days === Math.min(...carrierOptions.map(o => o.estimated_days));
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelected({ carrier: opt })}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                        isSelected ? 'border-black bg-black text-white' : 'border-neutral-100 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className={`text-sm font-normal uppercase tracking-tight flex items-center gap-2 ${isSelected ? 'text-white' : ''}`}>
                            {/^\d+$/.test(opt.method) ? opt.provider : `${opt.provider} — ${opt.method}`}
                            {isFastest && (
                              <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded uppercase tracking-widest ${
                                isSelected ? 'bg-blue-400/20 text-blue-300' : 'bg-blue-50 text-blue-600'
                              }`}>Mais Rápido</span>
                            )}
                          </div>
                          <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/60' : 'text-neutral-500'}`}>
                            {opt.estimated_days} {opt.estimated_days === 1 ? 'dia útil' : 'dias úteis'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                          <span className={`text-sm font-normal ${isSelected ? 'text-white' : ''}`}>
                            {formatCurrency(opt.real_cost, locale)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleShippingConfirm}
              disabled={isCalculating}
              className="w-full py-4 bg-black text-white rounded-2xl text-xs font-normal uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.01] transition-all disabled:opacity-30 active:scale-95"
            >
              Continuar para Pagamento
            </button>
            <button
              onClick={() => setTab('address')}
              className="w-full py-3 text-xs text-neutral-400 uppercase tracking-widest mt-1 hover:text-neutral-700 transition-colors"
            >
              ← Voltar ao endereço
            </button>
          </>
        )}
      </div>
    </div>
  );
}
