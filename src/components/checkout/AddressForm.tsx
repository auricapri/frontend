import React from 'react';
import { MapPin, Search, Navigation, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { type AddressData } from '../../types';
import { Locale } from '../../i18n';

interface AddressFormProps {
  cep: string;
  address: AddressData | null;
  num: string;
  complement: string;
  cepError: string | null;
  loadingCep: boolean;
  calculatingShipping: boolean;
  shippingDisplay: { price: number; days: number } | null;
  bestInternalShipping: any;
  currentUser: any;
  locale: Locale;
  onCepChange: (value: string) => void;
  onNumChange: (value: string) => void;
  onComplementChange: (value: string) => void;
  onOpenMapPicker: () => void;
  onNext: () => void;
  mapContainerRef: React.RefObject<HTMLDivElement>;
  mapError: boolean;
  mapboxLoaded: boolean;
  isManualAddress?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  cep,
  address,
  num,
  complement,
  cepError,
  loadingCep,
  calculatingShipping: _calculatingShipping,
  shippingDisplay: _shippingDisplay,
  bestInternalShipping,
  currentUser,
  locale: _locale,
  onCepChange,
  onNumChange,
  onComplementChange,
  onOpenMapPicker,
  onNext,
  mapContainerRef,
  mapError,
  mapboxLoaded,
  isManualAddress
}) => {
  return (
    <section className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
      <div className="flex items-center gap-6 mb-10">
        <div className="p-4 bg-neutral-50 rounded-2xl">
          <MapPin className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black uppercase italic tracking-tighter font-serif">Endereço de Entrega</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2 space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">CEP</label>
          <div className="relative">
            <input
              className={`w-full p-6 bg-neutral-50 border ${
                cepError ? 'border-red-200 bg-red-50/20' : 'border-neutral-100'
              } rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-mono text-lg tracking-widest`}
              placeholder="00000-000"
              maxLength={9}
              value={cep}
              onChange={(e) => onCepChange(e.target.value)}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300">
              {loadingCep ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={onOpenMapPicker}
              className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors flex items-center gap-2"
            >
              <Navigation className="w-3 h-3" /> Não sei meu CEP
            </button>
            {cepError && (
              <div className="flex items-center gap-2 text-[10px] text-red-500 font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" />
                {cepError}
              </div>
            )}
          </div>
        </div>
        
        {address && (
          <div className="md:col-span-2 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-neutral-900 text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl border border-white/10 overflow-hidden relative">
              <div className="relative z-10 flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">
                  {isManualAddress ? 'Localização Confirmada' : 'Destino Identificado'}
                </span>
                <h4 className="text-xl font-black uppercase italic tracking-tight mb-1">
                  {address.logradouro || (isManualAddress ? 'Rua não informada' : 'Endereço Identificado')}
                </h4>
                <p className="text-xs text-white/60 font-medium uppercase tracking-widest">
                  {address.bairro ? `${address.bairro} — ` : ''}{address.localidade}, {address.uf}
                </p>
              </div>
              
              {isManualAddress && (
                <div
                  ref={mapContainerRef}
                  className="w-full md:w-48 h-48 rounded-[2rem] bg-paper/5 border border-white/10 overflow-hidden relative shadow-inner"
                >
                  {(mapError || !mapboxLoaded) && (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                      <div className="text-center">
                        <MapPin className="w-6 h-6 text-white/20 mx-auto mb-2" />
                        <p className="text-[10px] text-white/40">Carregando mapa...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Número
                </label>
                <input
                  className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-black"
                  placeholder="Ex: 123"
                  value={num}
                  onChange={(e) => onNumChange(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Complemento
                </label>
                <input
                  className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-black"
                  placeholder="Ex: Apto 12"
                  value={complement}
                  onChange={(e) => onComplementChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="md:col-span-2 space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Nome do Destinatário
          </label>
          <input
            className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-black uppercase"
            placeholder="Nome Completo"
            defaultValue={currentUser?.full_name}
          />
        </div>
      </div>
      
      <button
        onClick={onNext}
        disabled={!address || !num || !bestInternalShipping}
        className="w-full md:w-auto px-16 py-8 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all disabled:opacity-20 active:scale-95"
      >
        Confirmar e Pagar <ChevronRight className="w-4 h-4" />
      </button>
    </section>
  );
};
