import React, { useState } from 'react';
import { AlertCircle, Check, Loader2, MapPin, Navigation, Search, ChevronDown } from 'lucide-react';
import { type CheckoutState } from '../hooks/useCheckoutState';
import { maskCep, normalizeCepDigits, validateCPF } from '../../../utils/masks';

export function AddressStep({ checkout }: { checkout: CheckoutState }) {
  const {
    currentUser,
    address,
    setAddress,
    cep,
    cepError,
    manualCepError,
    confirmManualAddress,
    handleCepChange,
    isManualAddress,
    loadingCep,
    mapContainerRef,
    mapError,
    mapboxLoaded,
    manualAddress,
    num,
    complement,
    recipientName,
    setRecipientName,
    phone,
    cpf,
    setCpf,
    cpfError,
    maskCPF,
    searchQuery,
    setComplement,
    setManualAddress,
    setNum,
    setPhone,
    handleSearchQueryChange,
    handleSelectSearchResult,
    isSearching,
    searchResults,
    setStep,
    shipping,
    // Saved addresses
    userAddresses,
    selectedAddressId,
    loadingAddresses,
    handleSelectSavedAddress,
  } = checkout;

  // State para busca inline (mobile-friendly)
  const [showInlineSearch, setShowInlineSearch] = useState(false);

  // Atualizar campo do endereço
  const updateAddressField = (field: string, value: string) => {
    if (address) {
      setAddress({ ...address, [field]: value });
    }
  };

  // Handler para quando seleciona um resultado da busca inline
  const handleInlineSearchSelect = (result: any) => {
    handleSelectSearchResult(result);
    // Após selecionar, a busca é fechada automaticamente e os campos são preenchidos
    setShowInlineSearch(false);
  };

  return (
    <>
      {/* Blocking loading overlay for CEP lookup */}
      {loadingCep && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-paper rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <Loader2 className="w-12 h-12 animate-spin text-black" />
            <div className="text-center">
              <h4 className="text-lg font-normal uppercase tracking-tight">Buscando Endereço</h4>
              <p className="text-sm text-neutral-500 mt-1">Aguarde enquanto localizamos seu CEP...</p>
            </div>
          </div>
        </div>
      )}
      <section className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-paper rounded-2xl">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-normal uppercase tracking-tight text-neutral-900">Endereço de Entrega</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Saved Addresses Dropdown */}
          {currentUser && userAddresses.length > 0 && (
            <div className="md:col-span-2 space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-normal uppercase tracking-widest text-neutral-600">
                Endereços Salvos
              </label>
              <div className="relative">
                <select
                  value={selectedAddressId || ''}
                  onChange={(e) => handleSelectSavedAddress(e.target.value)}
                  disabled={loadingAddresses}
                  className="w-full p-4 bg-paper border border-neutral-100 rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-normal appearance-none cursor-pointer pr-12"
                >
                  <option value="">+ Novo endereço</option>
                  {userAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.street_address || addr.line1}
                      {addr.neighborhood ? `, ${addr.neighborhood}` : ''}
                      {' - '}
                      {addr.city}
                      {addr.is_default ? ' (Padrão)' : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  {loadingAddresses ? (
                    <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                  ) : (
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-normal uppercase tracking-widest text-neutral-600">CEP</label>
            <div className="relative">
              <input
                data-testid="checkout-cep-input"
                className={`w-full p-4 bg-paper border ${
                  cepError ? 'border-red-200 bg-red-50/20' : 'border-neutral-100'
                } rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-mono text-lg tracking-widest`}
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
                onClick={() => setShowInlineSearch(!showInlineSearch)}
                data-testid="toggle-address-search"
                className="text-xs font-normal uppercase tracking-widest text-neutral-600 hover:text-black transition-colors flex items-center gap-2"
              >
                <Navigation className="w-3 h-3" />
                Não sei meu CEP
                <ChevronDown className={`w-3 h-3 transition-transform ${showInlineSearch ? 'rotate-180' : ''}`} />
              </button>
              {cepError && (
                <div className="flex items-center gap-2 text-xs text-red-500 font-normal uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3 h-3" />
                  {cepError}
                </div>
              )}
            </div>

            {/* Busca de Endereço Inline (mobile-friendly) */}
            {showInlineSearch && (
              <div className="mt-4 p-4 bg-paper rounded-2xl border border-neutral-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-normal uppercase tracking-widest text-neutral-600">
                    Buscar por Rua ou Bairro
                  </label>
                  <div className="relative">
                    <input
                      className="w-full p-4 pr-12 bg-paper border border-neutral-200 rounded-2xl text-sm font-normal outline-none focus:border-black transition-all"
                      placeholder="Digite sua rua, bairro ou cidade..."
                      value={searchQuery}
                      onChange={(e) => handleSearchQueryChange(e.target.value)}
                      autoFocus
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {isSearching ? (
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                      ) : (
                        <Search className="w-5 h-5 text-neutral-300" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Digite pelo menos 3 caracteres para buscar
                  </p>
                </div>

                {/* Resultados da busca */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleInlineSearchSelect(result)}
                        className="w-full p-4 bg-paper border border-neutral-100 rounded-xl text-left hover:border-black hover:bg-neutral-50 transition-all group"
                      >
                        <p className="text-sm font-normal uppercase tracking-tight group-hover:text-black">
                          {result.text}
                        </p>
                        <p className="text-xs text-neutral-500 truncate mt-1">
                          {result.place_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Formulário manual se não encontrou */}
                {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                  <div className="pt-4 border-t border-neutral-200 space-y-4">
                    <p className="text-xs font-normal uppercase tracking-widest text-neutral-500">
                      Não encontrou? Preencha manualmente:
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        className="w-full p-3 bg-paper border border-neutral-200 rounded-xl text-sm font-normal outline-none focus:border-black transition-all"
                        placeholder="Rua / Logradouro"
                        value={manualAddress.street}
                        onChange={(e) => setManualAddress({ ...manualAddress, street: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          className="w-full p-3 bg-paper border border-neutral-200 rounded-xl text-sm font-normal outline-none focus:border-black transition-all"
                          placeholder="Bairro"
                          value={manualAddress.neighborhood}
                          onChange={(e) => setManualAddress({ ...manualAddress, neighborhood: e.target.value })}
                        />
                        <input
                          className="w-full p-3 bg-paper border border-neutral-200 rounded-xl text-sm font-normal outline-none focus:border-black transition-all"
                          placeholder="Cidade"
                          value={manualAddress.city}
                          onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          className="w-full p-3 bg-paper border border-neutral-200 rounded-xl text-sm font-normal outline-none focus:border-black transition-all"
                          placeholder="Estado (UF)"
                          value={manualAddress.state}
                          onChange={(e) => setManualAddress({ ...manualAddress, state: e.target.value.toUpperCase() })}
                          maxLength={2}
                        />
                        <input
                          className="w-full p-3 bg-paper border border-neutral-200 rounded-xl text-sm font-normal font-mono outline-none focus:border-black transition-all"
                          placeholder="CEP"
                          value={manualAddress.cep}
                          onChange={(e) => {
                            const digits = normalizeCepDigits(e.target.value);
                            setManualAddress({ ...manualAddress, cep: digits ? maskCep(digits) : '' });
                          }}
                          inputMode="numeric"
                          maxLength={9}
                        />
                      </div>
                      {manualCepError && (
                        <div className="flex items-center gap-2 text-xs text-red-500 font-normal uppercase tracking-widest">
                          <AlertCircle className="w-3 h-3" />
                          {manualCepError}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          confirmManualAddress();
                          setShowInlineSearch(false);
                        }}
                        disabled={!manualAddress.street || !manualAddress.city || !manualAddress.neighborhood}
                        className="w-full py-3 bg-black text-white rounded-xl text-xs font-normal uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-30 transition-all"
                      >
                        <Check className="w-4 h-4" /> Confirmar Endereço
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {address && (
            <div className="md:col-span-2 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              {/* Banner só aparece se tiver bairro preenchido */}
              {address.bairro?.trim() && (
                <div className="bg-neutral-900 text-white p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl border border-white/10 overflow-hidden relative">
                  <div className="relative z-10 flex-1">
                    <span className="text-xs font-normal uppercase tracking-widest text-white/40 block mb-2">
                      {isManualAddress ? 'Localização Confirmada' : 'Destino Identificado'}
                    </span>
                    <h4 className="text-xl font-normal uppercase tracking-tight mb-1">
                      {address.logradouro || (isManualAddress ? 'Rua não informada' : 'Endereço Identificado')}
                    </h4>
                    <p className="text-xs text-white/60 font-medium uppercase tracking-widest">
                      {address.bairro} — {address.localidade}, {address.uf}
                    </p>
                  </div>
                  {isManualAddress && !!address.cep && (
                    <div
                      ref={mapContainerRef}
                      data-testid="checkout-minimap"
                      className="w-full md:w-48 h-48 rounded-[2rem] bg-paper/5 border border-white/10 overflow-hidden relative shadow-inner"
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
              )}

              {/* Campos editáveis de Rua e Bairro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-normal uppercase tracking-widest text-neutral-600">
                    Rua / Logradouro <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full p-4 bg-paper border border-neutral-100 rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-normal"
                    placeholder="Ex: Rua das Flores"
                    value={address?.logradouro || ''}
                    onChange={(e) => updateAddressField('logradouro', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-normal uppercase tracking-widest text-neutral-600">
                    Bairro <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full p-4 bg-paper border border-neutral-100 rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-normal"
                    placeholder="Ex: Centro"
                    value={address?.bairro || ''}
                    onChange={(e) => updateAddressField('bairro', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-normal uppercase tracking-widest text-neutral-600">Número <span className="text-red-500">*</span></label>
                  <input
                    className="w-full p-4 bg-paper border border-neutral-100 rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-normal"
                    placeholder="Ex: 123"
                    value={num}
                    onChange={(e) => setNum(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-normal uppercase tracking-widest text-neutral-600">Complemento</label>
                  <input
                    className="w-full p-4 bg-paper border border-neutral-100 rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-normal"
                    placeholder="Ex: Apto 12"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-normal uppercase tracking-widest text-neutral-600">Nome do Destinatário</label>
            <input
              className="w-full p-4 bg-paper border border-neutral-100 rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-normal uppercase"
              placeholder="Nome Completo"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>
          {(!currentUser?.phone || !currentUser.phone.trim()) && (
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-normal uppercase tracking-widest text-neutral-600">
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-4 bg-paper border border-neutral-100 rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-normal"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(checkout.maskPhone(e.target.value))}
                maxLength={15}
              />
            </div>
          )}
          <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-normal uppercase tracking-widest text-neutral-600">
                CPF <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full p-4 bg-paper border ${
                  cpfError ? 'border-red-300 bg-red-50/20' : cpf && cpf.replace(/\D/g, '').length === 11 && validateCPF(cpf) ? 'border-green-300' : cpf ? 'border-orange-200' : 'border-neutral-100'
                } rounded-2xl outline-none focus:bg-paper focus:border-black transition-all font-normal`}
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                maxLength={14}
              />
              <p className="text-xs text-neutral-400 font-medium">
                {cpfError
                  ? <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {cpfError}</span>
                  : 'Obrigatório para emissão de nota fiscal'}
              </p>
            </div>
        </div>
        <button
          onClick={() => address && setStep(2)}
          disabled={
            !address ||
            !address.logradouro?.trim() ||
            !address.bairro?.trim() ||
            !num ||
            !shipping.bestInternalShipping ||
            ((!currentUser?.phone || !currentUser.phone.trim()) && (!phone || phone.trim().length < 10)) ||
            (!currentUser?.cpf && (!cpf || cpf.replace(/\D/g, '').length !== 11 || !validateCPF(cpf)))
          }
          className="w-full md:w-auto px-8 py-4 bg-black text-white rounded-2xl text-xs font-normal uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-20 active:scale-95"
        >
          Confirmar e Pagar
        </button>
      </section>
    </>
  );
}
