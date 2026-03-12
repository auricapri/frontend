/// Addresses Tab Component
/// Displays saved addresses with management actions and inline add form

import React, { useState, useCallback } from 'react';
import { Loader2, MapPin, Check, Trash2, Plus, Search, X } from 'lucide-react';
import { AddressesState } from '../types';
import { NewAddressData } from '../hooks/useAddresses';

const MAX_ADDRESSES = 3;

interface AddressFormValues {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  number: string;
  complement: string;
  recipient_name: string;
}

const EMPTY_FORM: AddressFormValues = {
  cep: '', logradouro: '', bairro: '', localidade: '', uf: '',
  number: '', complement: '', recipient_name: '',
};

interface AddressesTabProps {
  addressesState: AddressesState;
  onSetDefault: (addressId: string) => void;
  onDelete: (addressId: string) => void;
  onAdd: (data: NewAddressData) => Promise<boolean>;
}

export const AddressesTab: React.FC<AddressesTabProps> = ({
  addressesState,
  onSetDefault,
  onDelete,
  onAdd,
}) => {
  const { addresses, loading, settingDefault, deletingAddress } = addressesState;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressFormValues>(EMPTY_FORM);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCepChange = useCallback(async (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 8);
    const formatted = cleaned.length > 5 ? `${cleaned.slice(0, 5)}-${cleaned.slice(5)}` : cleaned;
    setForm(f => ({ ...f, cep: formatted, logradouro: '', bairro: '', localidade: '', uf: '' }));
    setCepError(null);
    if (cleaned.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await res.json();
        if (data.erro) { setCepError('CEP não encontrado'); return; }
        setForm(f => ({
          ...f,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          localidade: data.localidade || '',
          uf: data.uf || '',
        }));
      } catch {
        setCepError('Erro ao consultar CEP');
      } finally {
        setCepLoading(false);
      }
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.localidade || !form.uf || !form.cep || !form.number) return;
    setSaving(true);
    const ok = await onAdd({
      street_address: form.logradouro || 'Rua não informada',
      number: form.number,
      complement: form.complement || undefined,
      neighborhood: form.bairro,
      city: form.localidade,
      state_province: form.uf,
      postal_code: form.cep.replace(/\D/g, ''),
      recipient_name: form.recipient_name || undefined,
    });
    setSaving(false);
    if (ok) { setForm(EMPTY_FORM); setShowForm(false); }
  }, [form, onAdd]);

  const canAdd = addresses.length < MAX_ADDRESSES;
  const isFormValid = form.localidade && form.uf && form.cep.replace(/\D/g,'').length === 8 && form.number;

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-300 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} />
        <span className="text-[10px] font-black uppercase tracking-widest">
          Carregando Endereços...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black font-serif uppercase tracking-[0.3em] text-neutral-300">
          Meus Endereços
        </h3>
        <span className="text-[10px] text-neutral-400">{addresses.length}/{MAX_ADDRESSES}</span>
      </div>

      {addresses.length === 0 && !showForm && (
        <div className="py-12 text-center space-y-4">
          <MapPin className="w-12 h-12 text-neutral-100 mx-auto" />
          <p className="text-sm text-neutral-400 font-medium">Nenhum endereço salvo</p>
        </div>
      )}

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
                <MapPin className={`w-4 h-4 ${addr.is_default ? 'text-white/60' : 'text-neutral-400'}`} />
                {addr.is_default && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-paper/20 rounded-full">
                    Padrão
                  </span>
                )}
              </div>
              <h4 className="text-sm font-black font-serif uppercase tracking-tight">
                {addr.street_address || addr.line1}
              </h4>
              <p className={`text-xs ${addr.is_default ? 'text-white/60' : 'text-neutral-500'}`}>
                {addr.neighborhood && `${addr.neighborhood} - `}
                {addr.city}, {addr.state_province || addr.state}
              </p>
              <p className={`text-xs font-mono ${addr.is_default ? 'text-white/40' : 'text-neutral-400'}`}>
                CEP: {addr.postal_code}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {!addr.is_default && (
                <button
                  onClick={() => onSetDefault(addr.id)}
                  disabled={settingDefault === addr.id}
                  className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {settingDefault === addr.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Definir Padrão
                </button>
              )}
              <button
                onClick={() => onDelete(addr.id)}
                disabled={deletingAddress === addr.id}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 ${
                  addr.is_default
                    ? 'bg-paper/10 text-white/60 hover:bg-paper/20'
                    : 'bg-red-50 text-red-500 hover:bg-red-100'
                }`}
              >
                {deletingAddress === addr.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add address form */}
      {showForm && canAdd && (
        <div className="p-6 rounded-[2rem] border border-neutral-200 bg-neutral-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Novo Endereço</span>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setCepError(null); }} className="text-neutral-400 hover:text-black transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">CEP</label>
            <div className="relative">
              <input
                className={`w-full p-4 bg-white border ${cepError ? 'border-red-300' : 'border-neutral-200'} rounded-2xl outline-none focus:border-black transition-all font-mono text-sm tracking-widest`}
                placeholder="00000-000"
                value={form.cep}
                onChange={e => handleCepChange(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300">
                {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </div>
            </div>
            {cepError && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{cepError}</p>}
          </div>

          {form.localidade && (
            <div className="bg-neutral-900 text-white px-5 py-3 rounded-2xl text-xs animate-in fade-in duration-300">
              <p className="font-black uppercase tracking-tight">{form.logradouro || 'Rua não informada'}</p>
              <p className="text-white/60 text-[10px]">{form.bairro && `${form.bairro} — `}{form.localidade}, {form.uf}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Número *</label>
              <input
                className="w-full p-4 bg-white border border-neutral-200 rounded-2xl outline-none focus:border-black transition-all font-black text-sm"
                placeholder="Ex: 123"
                value={form.number}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Complemento</label>
              <input
                className="w-full p-4 bg-white border border-neutral-200 rounded-2xl outline-none focus:border-black transition-all text-sm"
                placeholder="Apto, bloco..."
                value={form.complement}
                onChange={e => setForm(f => ({ ...f, complement: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nome do Destinatário</label>
            <input
              className="w-full p-4 bg-white border border-neutral-200 rounded-2xl outline-none focus:border-black transition-all font-black uppercase text-sm"
              placeholder="Nome Completo"
              value={form.recipient_name}
              onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!isFormValid || saving}
            className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Salvar Endereço
          </button>
        </div>
      )}

      {/* Footer: add button or limit message */}
      {!showForm && canAdd && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 border border-dashed border-neutral-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Endereço
        </button>
      )}

      {!canAdd && (
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-neutral-300 py-3">
          Limite de {MAX_ADDRESSES} endereços atingido — exclua um para adicionar outro
        </p>
      )}
    </div>
  );
};
