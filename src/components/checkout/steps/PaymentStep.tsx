import React from 'react';
import { Check, CheckCircle2, ChevronRight, Copy, CreditCard, CreditCard as CardIcon, Lock, QrCode } from 'lucide-react';
import { PaymentMethod } from '../../../constants/enums';
import { formatCurrency } from '../../../utils/currency';
import { type CheckoutState } from '../hooks/useCheckoutState';

export function PaymentStep({ checkout }: { checkout: CheckoutState }) {
  const {
    currentUser,
    locale,
    paymentMethod,
    setPaymentMethod,
    splitCards,
    setSplitCards,
    availableCashback,
    useCashback,
    setUseCashback,
    selectedSavedCardId,
    setSelectedSavedCardId,
    selectedSavedCardId2,
    setSelectedSavedCardId2,
    saveCardForFuture,
    setSaveCardForFuture,
    cardNumber,
    setCardNumber,
    cardName,
    setCardName,
    cardExpiry,
    setCardExpiry,
    cardCvc,
    setCardCvc,
    cardNumber2,
    setCardNumber2,
    cardName2,
    setCardName2,
    cardExpiry2,
    setCardExpiry2,
    cardCvc2,
    setCardCvc2,
    formatCardNumber,
    formatExpiry,
    formatCvc,
    payment,
    setStep,
  } = checkout;

  return (
    <section className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
      <div className="flex items-center gap-6 mb-10">
        <div className="p-4 bg-neutral-50 rounded-2xl">
          <CreditCard className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black uppercase italic tracking-tighter">Método de Pagamento</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          onClick={() => {
            setPaymentMethod(PaymentMethod.CREDIT_CARD);
            setSelectedSavedCardId(null);
          }}
          className={`p-10 border-2 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all ${
            paymentMethod === PaymentMethod.CREDIT_CARD
              ? 'border-black bg-neutral-50 shadow-xl scale-[1.02]'
              : 'border-neutral-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
          }`}
        >
          <CardIcon className="w-8 h-8" />
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Cartão de Crédito</span>
            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Até 10x sem juros</span>
          </div>
        </button>
        <button
          onClick={() => setPaymentMethod(PaymentMethod.PIX)}
          className={`p-10 border-2 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all ${
            paymentMethod === PaymentMethod.PIX
              ? 'border-black bg-neutral-50 shadow-xl scale-[1.02]'
              : 'border-neutral-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
          }`}
        >
          <div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center font-black text-[10px]">PIX</div>
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-widest block mb-1">PIX Instantâneo</span>
            <span className="text-[9px] text-green-500 font-black uppercase tracking-widest">5% de desconto</span>
          </div>
        </button>
      </div>

      {paymentMethod === PaymentMethod.CREDIT_CARD && (
        <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
          {currentUser && availableCashback > 0 && (
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-black">R$</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest block text-emerald-900">Cashback Disponível</span>
                  <span className="text-lg font-light tracking-tighter text-emerald-700">
                    {formatCurrency(availableCashback, locale)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setUseCashback(!useCashback)}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${useCashback ? 'bg-emerald-600' : 'bg-neutral-300'}`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    useCashback ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900">Dividir em dois cartões</span>
            <button
              onClick={() => {
                setSplitCards(!splitCards);
                if (!splitCards) {
                  setSelectedSavedCardId2(null);
                  setCardNumber2('');
                  setCardName2('');
                  setCardExpiry2('');
                  setCardCvc2('');
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${splitCards ? 'bg-black' : 'bg-neutral-300'}`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  splitCards ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-2">{splitCards ? 'Cartão 1' : 'Cartão de Pagamento'}</h4>

            {currentUser?.saved_cards && currentUser.saved_cards.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {currentUser.saved_cards
                    .filter((card) => !splitCards || card.id !== selectedSavedCardId2)
                    .map((card) => (
                      <div
                        key={card.id}
                        onClick={() => {
                          setSelectedSavedCardId(card.id === selectedSavedCardId ? null : card.id);
                          if (card.id !== selectedSavedCardId) {
                            setCardNumber('');
                            setCardName('');
                            setCardExpiry('');
                            setCardCvc('');
                          }
                        }}
                        className={`p-6 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                          selectedSavedCardId === card.id ? 'border-black bg-neutral-900 text-white' : 'border-neutral-100 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-6 bg-neutral-200 rounded flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-neutral-500">
                            {card.brand}
                          </div>
                          <div>
                            <p className="text-sm font-mono font-bold tracking-widest">•••• •••• •••• {card.last4}</p>
                            <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest">
                              Exp: {card.exp_month}/{card.exp_year}
                            </p>
                          </div>
                        </div>
                        {selectedSavedCardId === card.id && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                      </div>
                    ))}
                </div>
                {selectedSavedCardId && (
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex items-center gap-3 text-[10px] font-bold text-neutral-500">
                    <Lock className="w-3 h-3" /> Usando token seguro criptografado. Nenhum dado sensível trafega pela rede.
                  </div>
                )}
              </div>
            )}

            {!selectedSavedCardId && (
              <div className="space-y-8 bg-neutral-50/50 p-8 rounded-[2.5rem] border border-neutral-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Número do Cartão</label>
                    <input
                      className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none font-mono tracking-widest focus:border-black transition-all"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nome no Cartão</label>
                    <input
                      className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none font-black uppercase focus:border-black transition-all"
                      placeholder="NOME COMO IMPRESSO"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6 md:col-span-2">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Validade</label>
                      <input
                        className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none focus:border-black transition-all"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">CVC</label>
                      <input
                        className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none focus:border-black transition-all"
                        placeholder="123"
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(formatCvc(e.target.value))}
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                {currentUser && (
                  <div
                    className="flex items-center gap-4 p-4 border border-dashed border-neutral-200 rounded-2xl hover:border-black transition-all cursor-pointer"
                    onClick={() => setSaveCardForFuture(!saveCardForFuture)}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${saveCardForFuture ? 'bg-black border-black' : 'border-neutral-300'}`}>
                      {saveCardForFuture && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest block">Salvar Cartão</span>
                      <span className="text-[9px] text-neutral-400 block mt-0.5">Armazenamento seguro criptografado para compras futuras.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {splitCards && (
            <div className="space-y-6 pt-6 border-t border-neutral-200">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-2">Cartão 2</h4>

              {currentUser?.saved_cards && currentUser.saved_cards.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {currentUser.saved_cards
                      .filter((card) => card.id !== selectedSavedCardId)
                      .map((card) => (
                        <div
                          key={card.id}
                          onClick={() => {
                            setSelectedSavedCardId2(card.id === selectedSavedCardId2 ? null : card.id);
                            if (card.id !== selectedSavedCardId2) {
                              setCardNumber2('');
                              setCardName2('');
                              setCardExpiry2('');
                              setCardCvc2('');
                            }
                          }}
                          className={`p-6 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            selectedSavedCardId2 === card.id ? 'border-black bg-neutral-900 text-white' : 'border-neutral-100 bg-white hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-6 bg-neutral-200 rounded flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-neutral-500">
                              {card.brand}
                            </div>
                            <div>
                              <p className="text-sm font-mono font-bold tracking-widest">•••• •••• •••• {card.last4}</p>
                              <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest">
                                Exp: {card.exp_month}/{card.exp_year}
                              </p>
                            </div>
                          </div>
                          {selectedSavedCardId2 === card.id && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                        </div>
                      ))}
                  </div>
                  {selectedSavedCardId2 && (
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex items-center gap-3 text-[10px] font-bold text-neutral-500">
                      <Lock className="w-3 h-3" /> Usando token seguro criptografado. Nenhum dado sensível trafega pela rede.
                    </div>
                  )}
                </div>
              )}

              {!selectedSavedCardId2 && (
                <div className="space-y-8 bg-neutral-50/50 p-8 rounded-[2.5rem] border border-neutral-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Número do Cartão</label>
                      <input
                        className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none font-mono tracking-widest focus:border-black transition-all"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber2}
                        onChange={(e) => setCardNumber2(formatCardNumber(e.target.value))}
                        maxLength={19}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nome no Cartão</label>
                      <input
                        className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none font-black uppercase focus:border-black transition-all"
                        placeholder="NOME COMO IMPRESSO"
                        value={cardName2}
                        onChange={(e) => setCardName2(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6 md:col-span-2">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Validade</label>
                        <input
                          className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none focus:border-black transition-all"
                          placeholder="MM/YY"
                          value={cardExpiry2}
                          onChange={(e) => setCardExpiry2(formatExpiry(e.target.value))}
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">CVC</label>
                        <input
                          className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none focus:border-black transition-all"
                          placeholder="123"
                          type="password"
                          value={cardCvc2}
                          onChange={(e) => setCardCvc2(formatCvc(e.target.value))}
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {paymentMethod === PaymentMethod.PIX && (
        <div className="bg-neutral-900 text-white rounded-[3rem] p-10 md:p-16 flex flex-col items-center text-center space-y-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-6 bg-white rounded-[2.5rem] shadow-inner">
            <QrCode className="w-40 h-40 text-black" />
          </div>
          <div className="space-y-3">
            <h4 className="text-xl font-black uppercase italic tracking-tighter">Escanear QR Code</h4>
            <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
              Abra o app do seu banco e aponte a câmera. O pagamento é processado instantaneamente.
            </p>
          </div>
          <button
            onClick={payment.handleCopyPix}
            className="flex items-center gap-4 px-10 py-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group"
          >
            <Copy className="w-4 h-4 text-white/60 group-hover:text-white" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{payment.pixCopied ? 'Copiado!' : 'Copiar Chave PIX'}</span>
          </button>
        </div>
      )}

      <div className="flex gap-4 pt-12">
        <button
          onClick={() => setStep(1)}
          className="px-10 py-6 border border-neutral-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all"
        >
          Voltar
        </button>
        <button
          onClick={() => setStep(3)}
          className="flex-1 py-8 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all active:scale-95"
        >
          Revisar Pedido <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

