/// Addresses Tab Component
/// Displays saved addresses with management actions

import React from 'react';
import { Loader2, MapPin, Check, Trash2 } from 'lucide-react';
import { AddressesState } from '../types';

interface AddressesTabProps {
  addressesState: AddressesState;
  onSetDefault: (addressId: string) => void;
  onDelete: (addressId: string) => void;
}

export const AddressesTab: React.FC<AddressesTabProps> = ({
  addressesState,
  onSetDefault,
  onDelete,
}) => {
  const { addresses, loading, settingDefault, deletingAddress } = addressesState;

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-300 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} />
        <span className="text-[9px] font-black uppercase tracking-widest">
          Carregando Endereços...
        </span>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="py-20 text-center space-y-6">
        <MapPin className="w-12 h-12 text-neutral-100 mx-auto" />
        <p className="text-sm text-neutral-400 font-medium">Nenhum endereço salvo</p>
        <p className="text-xs text-neutral-300">
          Adicione um endereço durante o checkout para salvá-lo aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">
          Meus Endereços
        </h3>
        <span className="text-[9px] text-neutral-400">{addresses.length} endereço(s)</span>
      </div>

      {addresses.map(addr => (
        <div
          key={addr.id}
          className={`p-6 rounded-[2rem] border transition-all ${
            addr.is_default
              ? 'bg-neutral-900 text-white border-neutral-800'
              : 'bg-neutral-50 border-neutral-100 hover:border-neutral-300'
          }`}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin
                  className={`w-4 h-4 ${addr.is_default ? 'text-white/60' : 'text-neutral-400'}`}
                />
                {addr.is_default && (
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/20 rounded-full">
                    Padrão
                  </span>
                )}
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight">
                {addr.street_address || addr.line1}
              </h4>
              <p className={`text-xs ${addr.is_default ? 'text-white/60' : 'text-neutral-500'}`}>
                {addr.neighborhood && `${addr.neighborhood} - `}
                {addr.city}, {addr.state_province || addr.state}
              </p>
              <p
                className={`text-xs font-mono ${
                  addr.is_default ? 'text-white/40' : 'text-neutral-400'
                }`}
              >
                CEP: {addr.postal_code}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {!addr.is_default && (
                <button
                  onClick={() => onSetDefault(addr.id)}
                  disabled={settingDefault === addr.id}
                  className="px-4 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {settingDefault === addr.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Definir Padrão
                </button>
              )}
              <button
                onClick={() => onDelete(addr.id)}
                disabled={deletingAddress === addr.id}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 ${
                  addr.is_default
                    ? 'bg-white/10 text-white/60 hover:bg-white/20'
                    : 'bg-red-50 text-red-500 hover:bg-red-100'
                }`}
              >
                {deletingAddress === addr.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
