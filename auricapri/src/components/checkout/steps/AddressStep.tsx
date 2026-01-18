import React from 'react';
import { AlertCircle, Check, Loader2, MapPin, Navigation, Search, X } from 'lucide-react';
import { type CheckoutState } from '../hooks/useCheckoutState';
import { maskCep, normalizeCepDigits } from '../../../utils/masks';

export function AddressStep({ checkout }: { checkout: CheckoutState }) {
  const {
    currentUser,
    address,
    cep,
    cepError,
    manualCepError,
    confirmManualAddress,
    handleCepChange,
    isManualAddress,
    isMapPickerOpen,
    loadingCep,
    mapContainerRef,
    mapError,
    mapboxLoaded,
    manualAddress,
    num,
    complement,
    phone,
    cpf,
    setCpf,
    maskCPF,
    pickerContainerRef,
    searchQuery,
    setComplement,
    setIsMapPickerOpen,
    setManualAddress,
    setNum,
    setPhone,
    setSearchQuery,
    handlePickerSearch,
    handleSelectSearchResult,
    isSearching,
    searchResults,
    setStep,
    shipping,
  } = checkout;

  return (
    <>
      <section className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
        <div className="flex items-center gap-6 mb-10">
          <div className="p-4 bg-neutral-50 rounded-2xl">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black uppercase italic tracking-tight text-neutral-900">Endereço de Entrega</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-600">CEP</label>
            <div className="relative">
              <input
                data-testid="checkout-cep-input"
                className={`w-full p-6 bg-neutral-50 border ${
                  cepError ? 'border-red-200 bg-red-50/20' : 'border-neutral-100'
                } rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-mono text-lg tracking-widest`}
                placeholder="00000-000"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={9}
                value={cep}
                onChange={(e) => handleCepChange(e.target.value)}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300">
                {loadingCep ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIsMapPickerOpen(true)}
                data-testid="open-map-picker"
                className="text-xs font-black uppercase tracking-widest text-neutral-600 hover:text-black transition-colors flex items-center gap-2"
              >
                <Navigation className="w-3 h-3" /> Não sei meu CEP
              </button>
              {cepError && (
                <div className="flex items-center gap-2 text-xs text-red-500 font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
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
                  <span className="text-xs font-black uppercase tracking-widest text-white/40 block mb-2">
                    {isManualAddress ? 'Localização Confirmada' : 'Destino Identificado'}
                  </span>
                  <h4 className="text-xl font-black uppercase italic tracking-tight mb-1">
                    {address.logradouro || (isManualAddress ? 'Rua não informada' : 'Endereço Identificado')}
                  </h4>
                  <p className="text-xs text-white/60 font-medium uppercase tracking-widest">
                    {address.bairro ? `${address.bairro} — ` : ''}
                    {address.localidade}, {address.uf}
                  </p>
                </div>
                {isManualAddress && !!address.cep && (
                  <div
                    ref={mapContainerRef}
                    data-testid="checkout-minimap"
                    className="w-full md:w-48 h-48 rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden relative shadow-inner"
                  >
                    {(mapError || !mapboxLoaded) && (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        <div className="text-center">
                          <MapPin className="w-6 h-6 text-white/20 mx-auto mb-2" />
                          <p className="text-xs text-white/40">Carregando mapa...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-600">Número</label>
                  <input
                    className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-black"
                    placeholder="Ex: 123"
                    value={num}
                    onChange={(e) => setNum(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-600">Complemento</label>
                  <input
                    className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-black"
                    placeholder="Ex: Apto 12"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="md:col-span-2 space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-600">Nome do Destinatário</label>
            <input
              className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-black uppercase"
              placeholder="Nome Completo"
              defaultValue={currentUser?.full_name}
            />
          </div>
          {(!currentUser?.phone || !currentUser.phone.trim()) && (
            <div className="md:col-span-2 space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-600">
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-black"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(checkout.maskPhone(e.target.value))}
                maxLength={15}
              />
            </div>
          )}
          <div className="md:col-span-2 space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-600">
              CPF <span className="text-neutral-300">(opcional para nota fiscal)</span>
            </label>
            <input
              className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-mono"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              maxLength={14}
            />
          </div>
        </div>
        <button
          onClick={() => address && setStep(2)}
          disabled={
            !address ||
            !num ||
            !shipping.bestInternalShipping ||
            ((!currentUser?.phone || !currentUser.phone.trim()) && (!phone || phone.trim().length < 10))
          }
          className="w-full md:w-auto px-16 py-8 bg-black text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all disabled:opacity-20 active:scale-95"
        >
          Confirmar e Pagar
        </button>
      </section>

      {isMapPickerOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] md:h-[70vh]">
            <div className="w-full md:w-1/2 relative bg-neutral-100 flex items-center justify-center">
              <div ref={pickerContainerRef} className="w-full h-full" />
              <div className="absolute top-8 left-8 right-8 z-10">
                <div className="relative group">
                  <input
                    className="w-full p-6 pr-16 bg-white border-none rounded-2xl shadow-2xl text-xs font-black uppercase tracking-widest outline-none placeholder:text-neutral-300"
                    placeholder="Busque sua rua e cidade..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePickerSearch()}
                  />
                  <button
                    onClick={handlePickerSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black text-white rounded-xl hover:scale-105 transition-all"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-2">
                    {searchResults.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full p-4 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors"
                      >
                        <p className="text-xs font-black uppercase tracking-widest">{res.text}</p>
                        <p className="text-xs text-neutral-600 truncate">{res.place_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-between overflow-y-auto no-scrollbar">
              <div className="space-y-12">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">Localizador</h2>
                    <p className="text-xs font-black uppercase tracking-widest text-neutral-600">Confirme os detalhes do endereço</p>
                  </div>
                  <button onClick={() => setIsMapPickerOpen(false)} className="p-4 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-neutral-600">Rua / Logradouro</label>
                    <input
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black uppercase outline-none focus:border-black transition-all"
                      value={manualAddress.street}
                      onChange={(e) => setManualAddress({ ...manualAddress, street: e.target.value })}
                      placeholder="NOME DA RUA"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-neutral-600">Bairro</label>
                      <input
                        className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-black transition-all"
                        value={manualAddress.neighborhood}
                        onChange={(e) => setManualAddress({ ...manualAddress, neighborhood: e.target.value })}
                        placeholder="BAIRRO"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-neutral-600">Cidade</label>
                      <input
                        className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-black transition-all"
                        value={manualAddress.city}
                        onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })}
                        placeholder="CIDADE"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-neutral-600">Estado</label>
                      <input
                        className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-black transition-all"
                        value={manualAddress.state}
                        onChange={(e) => setManualAddress({ ...manualAddress, state: e.target.value.toUpperCase() })}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-neutral-600">CEP</label>
                      <input
                        className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-black transition-all"
                        value={manualAddress.cep}
                      onChange={(e) => {
                          const digits = normalizeCepDigits(e.target.value);
                          setManualAddress({ ...manualAddress, cep: digits ? maskCep(digits) : '' });
                        }}
                        placeholder="00000-000"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={9}
                      />
                      {manualCepError && (
                        <div className="flex items-center gap-2 text-xs text-red-500 font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="w-3 h-3" />
                          {manualCepError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={confirmManualAddress}
                data-testid="manual-address-confirm"
                disabled={!manualAddress.street || !manualAddress.city || !manualAddress.neighborhood}
                className="w-full py-8 bg-black text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 mt-12 hover:scale-[1.02] active:scale-95 disabled:opacity-20 transition-all"
              >
                <Check className="w-4 h-4" /> Confirmar Localização
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
