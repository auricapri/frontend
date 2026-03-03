import React, { useState } from 'react';
import { Check, CheckCircle2, ChevronRight, Copy, CreditCard, CreditCard as CardIcon, FileText, Lock, QrCode, Loader2, ExternalLink, Clock, Package } from 'lucide-react';
import { PaymentMethod } from '../../../constants/enums';
import { formatCurrency } from '../../../utils/currency';
import { type CheckoutState } from '../hooks/useCheckoutState';
import { InstallmentSelector } from '../InstallmentSelector';
import { SplitCardAmount } from '../SplitCardAmount';
import { CreditCardPreview } from '../CreditCardPreview';
import { PixCountdown } from '../PixCountdown';
import { LoadingModal } from '../../ui/LoadingModal';

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
    finalTotal,
    // Installment states
    installmentOptions,
    selectedInstallments,
    installmentsLoading,
    handleSelectInstallments,
    // Split card states
    card1Amount,
    card2Amount,
    card1Installments,
    card1Options,
    card2Installments,
    card2Options,
    handleCard1AmountChange,
    handleCard2AmountChange,
    handleSelectCard1Installments,
    handleSelectCard2Installments,
    splitCardsValid,
    // PIX/Boleto states
    pixData,
    pixLoading,
    pixError,
    boletoData,
    boletoLoading,
    boletoError,
    // Order with payment
    completeOrderWithPayment,
    paymentProcessing,
  } = checkout;

  // Handler to select PIX - generate PIX immediately
  const handleSelectPix = async () => {
    setPaymentMethod(PaymentMethod.PIX);
    // Se ainda não tem QR Code, gera automaticamente
    if (!pixData && !pixLoading) {
      try {
        // Pass PaymentMethod.PIX explicitly to avoid React state timing issues
        await completeOrderWithPayment(PaymentMethod.PIX);
      } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        // Error is handled by the state
      }
    }
  };

  // Handler to select Boleto - generate Boleto immediately
  const handleSelectBoleto = async () => {
    setPaymentMethod(PaymentMethod.BOLETO);
    // Se ainda não tem boleto, gera automaticamente
    if (!boletoData && !boletoLoading) {
      try {
        // Pass PaymentMethod.BOLETO explicitly to avoid React state timing issues
        await completeOrderWithPayment(PaymentMethod.BOLETO);
      } catch (error) {
        console.error('Erro ao gerar boleto:', error);
        // Error is handled by the state
      }
    }
  };

  // Estado para confirmar que pagou o boleto
  const [boletoConfirmed, setBoletoConfirmed] = useState(false);

  // PIX está pronto apenas se tiver QR Code E código copia-cola
  const pixReady = !!(pixData?.qrCodeImage && pixData?.qrCodePayload);
  // Boleto está pronto apenas se tiver código de barras
  const boletoReady = !!(boletoData?.barCode);
  // Estado de loading geral
  const isGenerating = pixLoading || paymentProcessing || boletoLoading;

  return (
    <section className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
      {/* Modal de loading durante geração do PIX/Boleto */}
      <LoadingModal
        isOpen={isGenerating}
        message={pixLoading ? 'Gerando PIX' : boletoLoading ? 'Gerando Boleto' : 'Processando pagamento'}
        subMessage="Por favor, aguarde enquanto preparamos seu pagamento"
      />

      <div className="flex items-center gap-6 mb-10">
        <div className="p-4 bg-neutral-50 rounded-2xl">
          <CreditCard className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-black uppercase italic tracking-tight text-neutral-900">Método de Pagamento</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => {
            setPaymentMethod(PaymentMethod.CREDIT_CARD);
            setSelectedSavedCardId(null);
          }}
          className={`p-8 border-2 rounded-[2rem] flex flex-col items-center gap-3 transition-all ${
            paymentMethod === PaymentMethod.CREDIT_CARD
              ? 'border-black bg-neutral-50 shadow-xl scale-[1.02]'
              : 'border-neutral-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
          }`}
        >
          <CardIcon className="w-7 h-7" />
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-wider block mb-1">Cartão de Crédito</span>
            <span className="text-xs text-neutral-600 font-bold uppercase tracking-widest">Até 10x</span>
          </div>
        </button>
        <button
          onClick={handleSelectPix}
          className={`p-8 border-2 rounded-[2rem] flex flex-col items-center gap-3 transition-all ${
            paymentMethod === PaymentMethod.PIX
              ? 'border-black bg-neutral-50 shadow-xl scale-[1.02]'
              : 'border-neutral-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
          }`}
        >
          <div className="w-7 h-7 bg-black text-white rounded flex items-center justify-center font-black text-[10px]">PIX</div>
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-wider block mb-1">PIX Instantâneo</span>
            <span className="text-xs text-green-500 font-black uppercase tracking-widest">5% de desconto</span>
          </div>
        </button>
        <button
          onClick={handleSelectBoleto}
          className={`p-8 border-2 rounded-[2rem] flex flex-col items-center gap-3 transition-all ${
            paymentMethod === PaymentMethod.BOLETO
              ? 'border-black bg-neutral-50 shadow-xl scale-[1.02]'
              : 'border-neutral-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
          }`}
        >
          <FileText className="w-7 h-7" />
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-wider block mb-1">Boleto Bancário</span>
            <span className="text-xs text-neutral-600 font-bold uppercase tracking-widest">Vence em 3 dias</span>
          </div>
        </button>
      </div>

      {/* Cashback toggle — available for ALL payment methods */}
      {currentUser && availableCashback > 0 && (
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-black">R$</span>
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider block text-emerald-900">Cashback Disponível</span>
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

      {paymentMethod === PaymentMethod.CREDIT_CARD && (
        <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
          {finalTotal >= 500 && (
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-900">Dividir em dois cartões</span>
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
          )}

          {/* Split Card Amount Selector */}
          {splitCards && finalTotal >= 500 && (
            <div className="p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100">
              <SplitCardAmount
                totalAmount={finalTotal}
                card1Amount={card1Amount}
                card2Amount={card2Amount}
                onCard1AmountChange={handleCard1AmountChange}
                onCard2AmountChange={handleCard2AmountChange}
                card1Installments={card1Installments}
                card1Options={card1Options}
                onCard1InstallmentsChange={handleSelectCard1Installments}
                card2Installments={card2Installments}
                card2Options={card2Options}
                onCard2InstallmentsChange={handleSelectCard2Installments}
                isLoading={installmentsLoading}
                locale={locale}
              />
            </div>
          )}

          {/* Installment Selector (when not split) */}
          {!splitCards && (
            <div className="p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100">
              <InstallmentSelector
                options={installmentOptions}
                selectedInstallments={selectedInstallments}
                onSelect={handleSelectInstallments}
                baseAmount={finalTotal}
                isLoading={installmentsLoading}
                locale={locale}
                compact
              />
            </div>
          )}

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-600 px-2">{splitCards ? 'Cartão 1' : 'Cartão de Pagamento'}</h4>

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
                          <div className="w-10 h-6 bg-neutral-200 rounded flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-neutral-700">
                            {card.brand}
                          </div>
                          <div>
                            <p className="text-sm font-mono font-bold tracking-widest">•••• •••• •••• {card.last4}</p>
                            <p className="text-xs opacity-60 font-bold uppercase tracking-widest">
                              Exp: {card.exp_month}/{card.exp_year}
                            </p>
                          </div>
                        </div>
                        {selectedSavedCardId === card.id && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                      </div>
                    ))}
                </div>
                {selectedSavedCardId && (
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex items-center gap-3 text-[10px] font-bold text-neutral-700">
                    <Lock className="w-3 h-3" /> Usando token seguro criptografado. Nenhum dado sensível trafega pela rede.
                  </div>
                )}
              </div>
            )}

            {!selectedSavedCardId && (
              <div className="space-y-6 md:space-y-8 bg-neutral-50/50 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[2.5rem] border border-neutral-100">
                {/* Preview do Cartão */}
                <CreditCardPreview
                  cardNumber={cardNumber}
                  cardName={cardName}
                  cardExpiry={cardExpiry}
                  cardCvc={cardCvc}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-black uppercase tracking-wide md:tracking-widest text-neutral-600">Número do Cartão</label>
                    <input
                      className="w-full p-4 md:p-6 bg-neutral-900 text-white border border-neutral-800 rounded-xl md:rounded-2xl outline-none font-mono text-sm md:text-base tracking-wide md:tracking-widest focus:border-neutral-600 focus:ring-1 md:focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-700 transition-all"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-black uppercase tracking-wide md:tracking-widest text-neutral-600">Nome no Cartão</label>
                    <input
                      className="w-full p-4 md:p-6 bg-neutral-900 text-white border border-neutral-800 rounded-xl md:rounded-2xl outline-none text-sm md:text-base font-black uppercase focus:border-neutral-600 focus:ring-1 md:focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-700 transition-all"
                      placeholder="NOME COMO IMPRESSO"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 md:col-span-2">
                    <div className="space-y-2">
                      <label className="text-[10px] md:text-xs font-black uppercase tracking-wide md:tracking-widest text-neutral-600">Validade</label>
                      <input
                        className="w-full p-4 md:p-6 bg-neutral-900 text-white border border-neutral-800 rounded-xl md:rounded-2xl outline-none text-sm md:text-base focus:border-neutral-600 focus:ring-1 md:focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-700 transition-all"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] md:text-xs font-black uppercase tracking-wide md:tracking-widest text-neutral-600">CVC</label>
                      <input
                        className="w-full p-4 md:p-6 bg-neutral-900 text-white border border-neutral-800 rounded-xl md:rounded-2xl outline-none text-sm md:text-base focus:border-neutral-600 focus:ring-1 md:focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-700 transition-all"
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
                    className="flex items-center gap-3 p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl md:rounded-2xl hover:border-neutral-600 transition-all cursor-pointer"
                    onClick={() => setSaveCardForFuture(!saveCardForFuture)}
                  >
                    <div className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${saveCardForFuture ? 'bg-white border-white' : 'border-neutral-500'}`}>
                      {saveCardForFuture && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <div className="flex-1">
                      <span className="text-[11px] md:text-xs font-bold uppercase tracking-wide md:tracking-wider block text-white">Salvar Cartão</span>
                      <span className="text-[10px] md:text-xs text-neutral-600 block mt-0.5 leading-snug">Armazenamento seguro criptografado para compras futuras.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {splitCards && finalTotal >= 500 && (
            <div className="space-y-6 pt-6 border-t border-neutral-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-600 px-2">Cartão 2</h4>

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
                            <div className="w-10 h-6 bg-neutral-200 rounded flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-neutral-700">
                              {card.brand}
                            </div>
                            <div>
                              <p className="text-sm font-mono font-bold tracking-widest">•••• •••• •••• {card.last4}</p>
                              <p className="text-xs opacity-60 font-bold uppercase tracking-widest">
                                Exp: {card.exp_month}/{card.exp_year}
                              </p>
                            </div>
                          </div>
                          {selectedSavedCardId2 === card.id && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                        </div>
                      ))}
                  </div>
                  {selectedSavedCardId2 && (
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex items-center gap-3 text-[10px] font-bold text-neutral-700">
                      <Lock className="w-3 h-3" /> Usando token seguro criptografado. Nenhum dado sensível trafega pela rede.
                    </div>
                  )}
                </div>
              )}

              {!selectedSavedCardId2 && (
                <div className="space-y-6 md:space-y-8 bg-neutral-50/50 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[2.5rem] border border-neutral-100">
                  {/* Preview do Cartão 2 */}
                  <CreditCardPreview
                    cardNumber={cardNumber2}
                    cardName={cardName2}
                    cardExpiry={cardExpiry2}
                    cardCvc={cardCvc2}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] md:text-xs font-black uppercase tracking-wide md:tracking-widest text-neutral-600">Número do Cartão</label>
                      <input
                        className="w-full p-4 md:p-6 bg-neutral-900 text-white border border-neutral-800 rounded-xl md:rounded-2xl outline-none font-mono text-sm md:text-base tracking-wide md:tracking-widest focus:border-neutral-600 focus:ring-1 md:focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-700 transition-all"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber2}
                        onChange={(e) => setCardNumber2(formatCardNumber(e.target.value))}
                        maxLength={19}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] md:text-xs font-black uppercase tracking-wide md:tracking-widest text-neutral-600">Nome no Cartão</label>
                      <input
                        className="w-full p-4 md:p-6 bg-neutral-900 text-white border border-neutral-800 rounded-xl md:rounded-2xl outline-none text-sm md:text-base font-black uppercase focus:border-neutral-600 focus:ring-1 md:focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-700 transition-all"
                        placeholder="NOME COMO IMPRESSO"
                        value={cardName2}
                        onChange={(e) => setCardName2(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 md:col-span-2">
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-wide md:tracking-widest text-neutral-600">Validade</label>
                        <input
                          className="w-full p-4 md:p-6 bg-neutral-900 text-white border border-neutral-800 rounded-xl md:rounded-2xl outline-none text-sm md:text-base focus:border-neutral-600 focus:ring-1 md:focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-700 transition-all"
                          placeholder="MM/YY"
                          value={cardExpiry2}
                          onChange={(e) => setCardExpiry2(formatExpiry(e.target.value))}
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-wide md:tracking-widest text-neutral-600">CVC</label>
                        <input
                          className="w-full p-4 md:p-6 bg-neutral-900 text-white border border-neutral-800 rounded-xl md:rounded-2xl outline-none text-sm md:text-base focus:border-neutral-600 focus:ring-1 md:focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-700 transition-all"
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
            {isGenerating ? (
              <div className="w-40 h-40 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-black animate-spin" />
              </div>
            ) : pixReady ? (
              <img
                src={`data:image/png;base64,${pixData?.qrCodeImage}`}
                alt="QR Code PIX"
                className="w-40 h-40"
              />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center">
                <QrCode className="w-24 h-24 text-neutral-300" />
              </div>
            )}
          </div>

          {/* Countdown de expiração - só mostra se PIX está pronto */}
          {pixReady && pixData?.expiresAt && (
            <PixCountdown expiresAt={pixData.expiresAt} />
          )}

          {pixError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl px-6 py-3">
              <span className="text-red-400 text-sm">{pixError}</span>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xl font-black uppercase italic tracking-tighter">
              {isGenerating ? 'Gerando QR Code...' : pixReady ? 'Escaneie o QR Code' : 'Clique para gerar o PIX'}
            </h4>
            <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
              {isGenerating
                ? 'Aguarde enquanto geramos seu QR Code PIX com validade de 10 minutos.'
                : pixReady
                  ? 'Abra o app do seu banco e aponte a câmera. O pagamento é processado instantaneamente.'
                  : 'O QR Code PIX será gerado automaticamente.'}
            </p>
          </div>

          {pixReady && (
            <>
              {/* Código copia e cola */}
              <div className="w-full max-w-md bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">Código PIX (Copia e Cola)</span>
                <div className="bg-black/30 p-3 rounded-xl">
                  <p className="font-mono text-[10px] break-all text-white/70 leading-relaxed">
                    {pixData?.qrCodePayload?.substring(0, 80)}...
                  </p>
                </div>
              </div>

              <button
                onClick={payment.handleCopyPix}
                className="flex items-center gap-4 px-10 py-5 bg-white text-black hover:bg-white/90 rounded-2xl transition-all group shadow-xl"
              >
                {payment.pixCopied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                  {payment.pixCopied ? 'Código Copiado!' : 'Copiar Código PIX'}
                </span>
              </button>

              <div className="text-[10px] text-white/30 mt-4">
                Pedido criado. Aguardando confirmação do pagamento.
              </div>
            </>
          )}
        </div>
      )}

      {paymentMethod === PaymentMethod.BOLETO && (
        <div className="bg-neutral-900 text-white rounded-[3rem] p-10 md:p-16 flex flex-col items-center text-center space-y-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          {boletoConfirmed ? (
            /* Tela de confirmação após clicar em "Já paguei" */
            <>
              <div className="p-6 bg-amber-500 rounded-[2.5rem] shadow-inner">
                <Clock className="w-32 h-32 text-white" />
              </div>

              <div className="space-y-3">
                <h4 className="text-2xl font-black uppercase italic tracking-tighter">
                  Pedido Pendente
                </h4>
                <p className="text-sm text-white/60 max-w-sm mx-auto leading-relaxed">
                  Seu pedido foi registrado e está aguardando a confirmação do pagamento.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 space-y-4 w-full max-w-md">
                <div className="flex items-center gap-4 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                  <Package className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  <div className="text-left">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">Estoque Reservado</span>
                    <span className="text-[10px] text-white/60">Seus itens estão reservados até o vencimento do boleto</span>
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3 text-[11px] text-white/60">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-black">1</span>
                    </div>
                    <span>Pagamento identificado em até <strong className="text-white">3 dias úteis</strong></span>
                  </div>
                  <div className="flex items-start gap-3 text-[11px] text-white/60">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-black">2</span>
                    </div>
                    <span>Após confirmação, seu pedido será <strong className="text-white">despachado em 24h</strong></span>
                  </div>
                  <div className="flex items-start gap-3 text-[11px] text-white/60">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-black">3</span>
                    </div>
                    <span>Você receberá atualizações por <strong className="text-white">e-mail e WhatsApp</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-white/30 mt-2">
                Acompanhe seu pedido na área "Meus Pedidos"
              </div>
            </>
          ) : (
            /* Tela normal do boleto */
            <>
              <div className="p-6 bg-white rounded-[2.5rem] shadow-inner">
                {boletoLoading ? (
                  <div className="w-40 h-40 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-black animate-spin" />
                  </div>
                ) : (
                  <FileText className="w-40 h-40 text-black" />
                )}
              </div>

              {boletoError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-2xl px-6 py-3">
                  <span className="text-red-400 text-sm">{boletoError}</span>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xl font-black uppercase italic tracking-tighter">
                  {boletoData ? 'Boleto Gerado' : 'Boleto Bancário'}
                </h4>
                <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
                  {boletoData
                    ? `Vencimento: ${boletoData.dueDate.toLocaleDateString('pt-BR')}`
                    : 'O boleto será gerado após a confirmação do pedido. Você terá 3 dias úteis para efetuar o pagamento.'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 space-y-4 w-full max-w-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-white/60">Valor do boleto</span>
                  <span className="text-lg font-black">{formatCurrency(finalTotal, locale)}</span>
                </div>

                {boletoData ? (
                  <>
                    {/* Linha digitável */}
                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-wider text-white/60 block">Linha Digitável</span>
                      <div className="bg-white/5 p-4 rounded-xl">
                        <p className="font-mono text-xs break-all text-white/80">{boletoData.barCode}</p>
                      </div>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(boletoData.barCode);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Copiar</span>
                      </button>
                      {boletoData.bankSlipUrl && (
                        <a
                          href={boletoData.bankSlipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Abrir PDF</span>
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-[10px] text-white/40">
                      <div className="w-2 h-2 rounded-full bg-white/40" />
                      <span>O boleto será enviado por e-mail e ficará disponível na área do pedido</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/40">
                      <div className="w-2 h-2 rounded-full bg-white/40" />
                      <span>Após o pagamento, a confirmação pode levar até 3 dias úteis</span>
                    </div>
                  </>
                )}
              </div>

              {/* Botão "Já paguei" - só aparece se o boleto foi gerado */}
              {boletoReady && (
                <button
                  onClick={() => setBoletoConfirmed(true)}
                  className="w-full max-w-md py-6 bg-green-600 hover:bg-green-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Já Paguei o Boleto
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Se PIX ou Boleto já foi gerado com sucesso, mostra botão de voltar */}
      {(pixReady || boletoReady) ? (
        <div className="flex gap-4 pt-12">
          <button
            onClick={() => setStep(1)}
            className="flex-1 px-10 py-6 border border-neutral-200 rounded-[2rem] text-xs font-black uppercase tracking-wider hover:bg-neutral-50 transition-all"
          >
            Voltar ao Endereço
          </button>
        </div>
      ) : (
        <div className="flex gap-4 pt-12">
          <button
            onClick={() => setStep(1)}
            disabled={isGenerating}
            className="px-10 py-6 border border-neutral-200 rounded-[2rem] text-xs font-black uppercase tracking-wider hover:bg-neutral-50 transition-all disabled:opacity-50"
          >
            Voltar
          </button>
          {paymentMethod === PaymentMethod.CREDIT_CARD ? (
            <button
              onClick={() => setStep(3)}
              disabled={splitCards && !splitCardsValid}
              className={`flex-1 py-8 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 transition-all ${
                splitCards && !splitCardsValid
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:scale-[1.02] active:scale-95'
              }`}
            >
              Revisar Pedido <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex-1 py-8 bg-neutral-100 text-neutral-400 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando {paymentMethod === PaymentMethod.PIX ? 'PIX' : 'Boleto'}...
                </>
              ) : (
                'Aguardando geração do pagamento...'
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

