import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, CreditCard, FileText, Info, Loader2 } from 'lucide-react';
import { PaymentMethod } from '../../../constants/enums';
import { type CheckoutState } from '../hooks/useCheckoutState';
import { LoadingModal } from '../../ui/LoadingModal';
import { Modal } from '../../ui/Modal';
import { CashbackToggle } from './CashbackToggle';
import { CreditCardForm } from './CreditCardForm';
import { PixPaymentSection } from './PixPaymentSection';
import { BoletoSection } from './BoletoSection';

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
    cardNumber, setCardNumber,
    cardName, setCardName,
    cardExpiry, setCardExpiry,
    cardCvc, setCardCvc,
    cardNumber2, setCardNumber2,
    cardName2, setCardName2,
    cardExpiry2, setCardExpiry2,
    cardCvc2, setCardCvc2,
    formatCardNumber,
    formatExpiry,
    formatCvc,
    payment,
    setStep,
    finalTotal,
    installmentOptions,
    selectedInstallments,
    installmentsLoading,
    handleSelectInstallments,
    card1Amount, card2Amount,
    card1Installments, card1Options,
    card2Installments, card2Options,
    handleCard1AmountChange,
    handleCard2AmountChange,
    handleSelectCard1Installments,
    handleSelectCard2Installments,
    splitCardsValid,
    pixData, pixLoading, pixError,
    boletoData, boletoLoading, boletoError,
    completeOrderWithPayment,
    paymentProcessing,
  } = checkout;

  const [asaasNoticeOpen, setAsaasNoticeOpen] = useState(false);
  const asaasShownThisSession = useRef(false);

  const tryShowAsaasNotice = useCallback(() => {
    if (asaasShownThisSession.current) return;
    const count = parseInt(localStorage.getItem('asaas_notice_count') ?? '0', 10);
    if (count % 3 === 0) {
      asaasShownThisSession.current = true;
      setAsaasNoticeOpen(true);
    }
  }, []);

  const handleDismissAsaasNotice = useCallback(() => {
    setAsaasNoticeOpen(false);
    const count = parseInt(localStorage.getItem('asaas_notice_count') ?? '0', 10);
    localStorage.setItem('asaas_notice_count', String(count + 1));
  }, []);

  // Fallback for auto-regeneration (coupon change triggers new PIX/boleto from parent)
  useEffect(() => {
    if (!pixData && !boletoData) return;
    tryShowAsaasNotice();
  }, [pixData, boletoData, tryShowAsaasNotice]);

  const handleSelectPix = useCallback(async () => {
    setPaymentMethod(PaymentMethod.PIX);
    if (!pixData && !pixLoading) {
      try {
        await completeOrderWithPayment(PaymentMethod.PIX);
        tryShowAsaasNotice();
      } catch {
        // Error stored in pixError state via usePixBoletoState
      }
    }
  }, [setPaymentMethod, pixData, pixLoading, completeOrderWithPayment, tryShowAsaasNotice]);

  const handleSelectBoleto = useCallback(async () => {
    setPaymentMethod(PaymentMethod.BOLETO);
    if (!boletoData && !boletoLoading) {
      try {
        await completeOrderWithPayment(PaymentMethod.BOLETO);
        tryShowAsaasNotice();
      } catch {
        // Error stored in boletoError state via usePixBoletoState
      }
    }
  }, [setPaymentMethod, boletoData, boletoLoading, completeOrderWithPayment, tryShowAsaasNotice]);

  const handleToggleSplit = useCallback(() => {
    setSplitCards(!splitCards);
    if (!splitCards) {
      setSelectedSavedCardId2(null);
      setCardNumber2('');
      setCardName2('');
      setCardExpiry2('');
      setCardCvc2('');
    }
  }, [splitCards, setSplitCards, setSelectedSavedCardId2, setCardNumber2, setCardName2, setCardExpiry2, setCardCvc2]);

  const handleSelectCard = useCallback(() => {
    setPaymentMethod(PaymentMethod.CREDIT_CARD);
    setSelectedSavedCardId(null);
  }, [setPaymentMethod, setSelectedSavedCardId]);

  const handleToggleCashback = useCallback(() => setUseCashback(!useCashback), [useCashback, setUseCashback]);

  const pixReady = !!(pixData?.qrCodeImage && pixData?.qrCodePayload);
  const boletoReady = !!(boletoData?.barCode);
  const isGenerating = pixLoading || paymentProcessing || boletoLoading;

  const paymentLabel = paymentMethod === PaymentMethod.PIX ? 'PIX' : 'Boleto';

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
      <LoadingModal
        isOpen={isGenerating}
        message={pixLoading ? 'Gerando PIX' : boletoLoading ? 'Gerando Boleto' : 'Processando pagamento'}
        subMessage="Por favor, aguarde enquanto preparamos seu pagamento"
      />

      <Modal isOpen={asaasNoticeOpen} onClose={handleDismissAsaasNotice} size="sm">
        <div className="flex flex-col items-center gap-5 p-2 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Info className="w-6 h-6 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-normal uppercase tracking-widest">Aviso sobre e-mail</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Caso você receba um e-mail de cobrança via {paymentLabel} do nosso sistema de pagamentos
              (Asaas), não se preocupe — isso é automático e esperado.
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Se você desistir da compra, basta desconsiderar o e-mail. Nenhum valor será cobrado
              enquanto o pagamento não for confirmado.
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed mt-1">
              Atenciosamente,<br />Auricapri
            </p>
          </div>
          <button
            onClick={handleDismissAsaasNotice}
            className="w-full py-3 bg-black text-white rounded-xl text-xs font-normal uppercase tracking-widest hover:bg-neutral-800 transition-all"
          >
            Entendi
          </button>
        </div>
      </Modal>

      <div className="flex items-center gap-4 mb-4">
        <div className="p-4 bg-paper rounded-2xl">
          <CreditCard className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-normal uppercase tracking-tight text-neutral-900">Método de Pagamento</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={handleSelectCard}
          className={`p-5 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all ${
            paymentMethod === PaymentMethod.CREDIT_CARD
              ? 'border-black bg-paper shadow-xl scale-[1.02]'
              : 'border-neutral-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
          }`}
        >
          <CreditCard className="w-7 h-7" />
          <div className="text-center">
            <span className="text-xs font-normal uppercase tracking-wider block mb-1">Cartão de Crédito</span>
            <span className="text-xs text-neutral-600 font-normal uppercase tracking-widest">Até 10x</span>
          </div>
        </button>
        <button
          onClick={handleSelectPix}
          className={`p-5 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all ${
            paymentMethod === PaymentMethod.PIX
              ? 'border-black bg-paper shadow-xl scale-[1.02]'
              : 'border-neutral-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
          }`}
        >
          <div className="w-7 h-7 bg-black text-white rounded flex items-center justify-center font-normal text-[10px]">PIX</div>
          <div className="text-center">
            <span className="text-xs font-normal uppercase tracking-wider block mb-1">PIX Instantâneo</span>
            <span className="text-xs text-green-500 font-normal uppercase tracking-widest">5% de desconto</span>
          </div>
        </button>
        <button
          onClick={handleSelectBoleto}
          className={`p-5 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all ${
            paymentMethod === PaymentMethod.BOLETO
              ? 'border-black bg-paper shadow-xl scale-[1.02]'
              : 'border-neutral-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
          }`}
        >
          <FileText className="w-7 h-7" />
          <div className="text-center">
            <span className="text-xs font-normal uppercase tracking-wider block mb-1">Boleto Bancário</span>
            <span className="text-xs text-neutral-600 font-normal uppercase tracking-widest">Vence em 3 dias</span>
          </div>
        </button>
      </div>

      {/* CashbackToggle is shown for ALL payment methods */}
      {currentUser && availableCashback > 0 && (
        <CashbackToggle
          availableCashback={availableCashback}
          useCashback={useCashback}
          onToggle={handleToggleCashback}
          locale={locale}
        />
      )}

      {paymentMethod === PaymentMethod.CREDIT_CARD && (
        <CreditCardForm
          finalTotal={finalTotal}
          splitCards={splitCards}
          onToggleSplit={handleToggleSplit}
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
          installmentOptions={installmentOptions}
          selectedInstallments={selectedInstallments}
          onSelectInstallments={handleSelectInstallments}
          installmentsLoading={installmentsLoading}
          locale={locale}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          cardName={cardName}
          setCardName={setCardName}
          cardExpiry={cardExpiry}
          setCardExpiry={setCardExpiry}
          cardCvc={cardCvc}
          setCardCvc={setCardCvc}
          cardNumber2={cardNumber2}
          setCardNumber2={setCardNumber2}
          cardName2={cardName2}
          setCardName2={setCardName2}
          cardExpiry2={cardExpiry2}
          setCardExpiry2={setCardExpiry2}
          cardCvc2={cardCvc2}
          setCardCvc2={setCardCvc2}
          currentUser={currentUser}
          selectedSavedCardId={selectedSavedCardId}
          setSelectedSavedCardId={setSelectedSavedCardId}
          selectedSavedCardId2={selectedSavedCardId2}
          setSelectedSavedCardId2={setSelectedSavedCardId2}
          saveCardForFuture={saveCardForFuture}
          setSaveCardForFuture={setSaveCardForFuture}
          formatCardNumber={formatCardNumber}
          formatExpiry={formatExpiry}
          formatCvc={formatCvc}
        />
      )}

      {paymentMethod === PaymentMethod.PIX && (
        <PixPaymentSection
          pixData={pixData}
          pixError={pixError}
          isGenerating={isGenerating}
          pixCopied={payment.pixCopied}
          onCopyPix={payment.handleCopyPix}
        />
      )}

      {paymentMethod === PaymentMethod.BOLETO && (
        <BoletoSection
          boletoData={boletoData}
          boletoError={boletoError}
          boletoLoading={boletoLoading}
          finalTotal={finalTotal}
          locale={locale}
        />
      )}

      {(pixReady || boletoReady) && paymentMethod !== PaymentMethod.CREDIT_CARD ? (
        <div className="flex gap-4 pt-6">
          <button
            onClick={() => setStep(1)}
            className="flex-1 px-6 py-4 border border-neutral-200 rounded-2xl text-xs font-normal uppercase tracking-wider hover:bg-neutral-50 transition-all"
          >
            Voltar ao Endereço
          </button>
        </div>
      ) : (
        <div className="flex gap-4 pt-6">
          <button
            onClick={() => setStep(1)}
            disabled={isGenerating}
            className="px-6 py-4 border border-neutral-200 rounded-2xl text-xs font-normal uppercase tracking-wider hover:bg-neutral-50 transition-all disabled:opacity-50"
          >
            Voltar
          </button>
          {paymentMethod === PaymentMethod.CREDIT_CARD ? (
            <button
              onClick={() => setStep(3)}
              disabled={splitCards && !splitCardsValid}
              className={`flex-1 py-5 bg-black text-white rounded-2xl text-[10px] font-normal uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 transition-all ${
                splitCards && !splitCardsValid
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:scale-[1.02] active:scale-95'
              }`}
            >
              Revisar Pedido <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex-1 py-5 bg-neutral-100 text-neutral-400 rounded-2xl text-[10px] font-normal uppercase tracking-[0.4em] flex items-center justify-center gap-4">
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
