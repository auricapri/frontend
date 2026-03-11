import { useCallback } from 'react';
import { Check, CheckCircle2, Lock } from 'lucide-react';
import { CreditCardPreview } from '../CreditCardPreview';
import { InstallmentSelector } from '../InstallmentSelector';
import { SplitCardAmount } from '../SplitCardAmount';
import type { InstallmentOption } from '../../../types/payment.types';
import type { Locale } from '../../../i18n';
import type { SavedCard, UserProfile } from '../../../types';

interface CreditCardFormProps {
  // Split toggle
  finalTotal: number;
  splitCards: boolean;
  onToggleSplit: () => void;

  // Split card amounts
  card1Amount: number;
  card2Amount: number;
  onCard1AmountChange: (amount: number) => void;
  onCard2AmountChange: (amount: number) => void;
  card1Installments: number;
  card1Options: InstallmentOption[];
  onCard1InstallmentsChange: (installments: number, code: string) => void;
  card2Installments: number;
  card2Options: InstallmentOption[];
  onCard2InstallmentsChange: (installments: number, code: string) => void;

  // Single card installments
  installmentOptions: InstallmentOption[];
  selectedInstallments: number;
  onSelectInstallments: (installments: number, code: string) => void;
  installmentsLoading: boolean;
  locale: Locale;

  // Card 1 fields
  cardNumber: string;
  setCardNumber: (value: string) => void;
  cardName: string;
  setCardName: (value: string) => void;
  cardExpiry: string;
  setCardExpiry: (value: string) => void;
  cardCvc: string;
  setCardCvc: (value: string) => void;

  // Card 2 fields
  cardNumber2: string;
  setCardNumber2: (value: string) => void;
  cardName2: string;
  setCardName2: (value: string) => void;
  cardExpiry2: string;
  setCardExpiry2: (value: string) => void;
  cardCvc2: string;
  setCardCvc2: (value: string) => void;

  // Saved cards
  currentUser: UserProfile | null;
  selectedSavedCardId: string | null;
  setSelectedSavedCardId: (id: string | null) => void;
  selectedSavedCardId2: string | null;
  setSelectedSavedCardId2: (id: string | null) => void;
  saveCardForFuture: boolean;
  setSaveCardForFuture: (save: boolean) => void;

  // Formatters
  formatCardNumber: (value: string) => string;
  formatExpiry: (value: string) => string;
  formatCvc: (value: string) => string;
}

const INPUT_CLASS =
  'w-full p-4 md:p-6 bg-neutral-900 text-white border border-neutral-800 rounded-xl md:rounded-2xl outline-none font-mono text-sm md:text-base tracking-wide md:tracking-widest focus:border-neutral-600 focus:ring-1 md:focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-700 transition-all';

const INPUT_CLASS_TEXT =
  'w-full p-4 md:p-6 bg-neutral-900 text-white border border-neutral-800 rounded-xl md:rounded-2xl outline-none text-sm md:text-base font-black uppercase focus:border-neutral-600 focus:ring-1 md:focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-700 transition-all';

const INPUT_CLASS_SHORT =
  'w-full p-4 md:p-6 bg-neutral-900 text-white border border-neutral-800 rounded-xl md:rounded-2xl outline-none text-sm md:text-base focus:border-neutral-600 focus:ring-1 md:focus:ring-2 focus:ring-neutral-700 placeholder:text-neutral-700 transition-all';

const LABEL_CLASS = 'text-[10px] md:text-xs font-black uppercase tracking-wide md:tracking-widest text-neutral-600';

interface SavedCardListProps {
  savedCards: SavedCard[];
  selectedId: string | null;
  excludeId: string | null;
  onSelect: (id: string | null) => void;
  onDeselect: () => void;
}

function SavedCardList({ savedCards, selectedId, excludeId, onSelect, onDeselect }: SavedCardListProps) {
  const handleClick = useCallback(
    (cardId: string) => {
      if (cardId === selectedId) {
        onSelect(null);
      } else {
        onSelect(cardId);
        onDeselect();
      }
    },
    [selectedId, onSelect, onDeselect]
  );

  const filtered = excludeId ? savedCards.filter((c) => c.id !== excludeId) : savedCards;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((card) => (
          <div
            key={card.id}
            onClick={() => handleClick(card.id)}
            className={`p-6 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
              selectedId === card.id ? 'border-black bg-neutral-900 text-white' : 'border-neutral-100 bg-paper hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-6 bg-neutral-200 rounded flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-neutral-700">
                {card.brand}
              </div>
              <div>
                <p className="text-sm font-mono font-bold tracking-widest">•••• •••• •••• {card.last4}</p>
                <p className="text-xs opacity-60 font-bold uppercase tracking-widest">
                  {card.exp_month != null && card.exp_year != null ? `Exp: ${card.exp_month}/${card.exp_year}` : ''}
                </p>
              </div>
            </div>
            {selectedId === card.id && <CheckCircle2 className="w-5 h-5 text-green-400" />}
          </div>
        ))}
      </div>
      {selectedId && (
        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex items-center gap-3 text-[10px] font-bold text-neutral-700">
          <Lock className="w-3 h-3" /> Usando token seguro criptografado. Nenhum dado sensível trafega pela rede.
        </div>
      )}
    </div>
  );
}

interface CardFieldsProps {
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardName: string;
  setCardName: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvc: string;
  setCardCvc: (v: string) => void;
  formatCardNumber: (v: string) => string;
  formatExpiry: (v: string) => string;
  formatCvc: (v: string) => string;
  showSaveToggle: boolean;
  saveCardForFuture: boolean;
  onToggleSave: () => void;
}

function CardFields({
  cardNumber, setCardNumber,
  cardName, setCardName,
  cardExpiry, setCardExpiry,
  cardCvc, setCardCvc,
  formatCardNumber, formatExpiry, formatCvc,
  showSaveToggle, saveCardForFuture, onToggleSave,
}: CardFieldsProps) {
  return (
    <div className="space-y-6 md:space-y-8 bg-neutral-50/50 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[2.5rem] border border-neutral-100">
      <CreditCardPreview
        cardNumber={cardNumber}
        cardName={cardName}
        cardExpiry={cardExpiry}
        cardCvc={cardCvc}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Número do Cartão</label>
          <input
            className={INPUT_CLASS}
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            maxLength={19}
          />
        </div>
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Nome no Cartão</label>
          <input
            className={INPUT_CLASS_TEXT}
            placeholder="NOME COMO IMPRESSO"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 md:col-span-2">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Validade</label>
            <input
              className={INPUT_CLASS_SHORT}
              placeholder="MM/YY"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
              maxLength={5}
            />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>CVC</label>
            <input
              className={INPUT_CLASS_SHORT}
              placeholder="123"
              type="password"
              value={cardCvc}
              onChange={(e) => setCardCvc(formatCvc(e.target.value))}
              maxLength={4}
            />
          </div>
        </div>
      </div>

      {showSaveToggle && (
        <div
          className="flex items-center gap-3 p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl md:rounded-2xl hover:border-neutral-600 transition-all cursor-pointer"
          onClick={onToggleSave}
        >
          <div className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${saveCardForFuture ? 'bg-paper border-white' : 'border-neutral-500'}`}>
            {saveCardForFuture && <Check className="w-3 h-3 text-black" />}
          </div>
          <div className="flex-1">
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wide md:tracking-wider block text-white">Salvar Cartão</span>
            <span className="text-[10px] md:text-xs text-neutral-600 block mt-0.5 leading-snug">Armazenamento seguro criptografado para compras futuras.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function CreditCardForm({
  finalTotal,
  splitCards,
  onToggleSplit,
  card1Amount, card2Amount, onCard1AmountChange, onCard2AmountChange,
  card1Installments, card1Options, onCard1InstallmentsChange,
  card2Installments, card2Options, onCard2InstallmentsChange,
  installmentOptions, selectedInstallments, onSelectInstallments,
  installmentsLoading, locale,
  cardNumber, setCardNumber, cardName, setCardName,
  cardExpiry, setCardExpiry, cardCvc, setCardCvc,
  cardNumber2, setCardNumber2, cardName2, setCardName2,
  cardExpiry2, setCardExpiry2, cardCvc2, setCardCvc2,
  currentUser,
  selectedSavedCardId, setSelectedSavedCardId,
  selectedSavedCardId2, setSelectedSavedCardId2,
  saveCardForFuture, setSaveCardForFuture,
  formatCardNumber, formatExpiry, formatCvc,
}: CreditCardFormProps) {
  const handleToggleSave = useCallback(() => setSaveCardForFuture(!saveCardForFuture), [saveCardForFuture, setSaveCardForFuture]);

  const handleDeselectCard1Fields = useCallback(() => {
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvc('');
  }, [setCardNumber, setCardName, setCardExpiry, setCardCvc]);

  const handleDeselectCard2Fields = useCallback(() => {
    setCardNumber2('');
    setCardName2('');
    setCardExpiry2('');
    setCardCvc2('');
  }, [setCardNumber2, setCardName2, setCardExpiry2, setCardCvc2]);

  const savedCards: SavedCard[] = currentUser?.saved_cards ?? [];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
      {finalTotal >= 500 && (
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-900">Dividir em dois cartões</span>
          <button
            onClick={onToggleSplit}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${splitCards ? 'bg-black' : 'bg-neutral-300'}`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-paper rounded-full shadow-sm transition-transform duration-300 ${
                splitCards ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

      {splitCards && finalTotal >= 500 && (
        <div className="p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100">
          <SplitCardAmount
            totalAmount={finalTotal}
            card1Amount={card1Amount}
            card2Amount={card2Amount}
            onCard1AmountChange={onCard1AmountChange}
            onCard2AmountChange={onCard2AmountChange}
            card1Installments={card1Installments}
            card1Options={card1Options}
            onCard1InstallmentsChange={onCard1InstallmentsChange}
            card2Installments={card2Installments}
            card2Options={card2Options}
            onCard2InstallmentsChange={onCard2InstallmentsChange}
            isLoading={installmentsLoading}
            locale={locale}
          />
        </div>
      )}

      {!splitCards && (
        <div className="p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100">
          <InstallmentSelector
            options={installmentOptions}
            selectedInstallments={selectedInstallments}
            onSelect={onSelectInstallments}
            baseAmount={finalTotal}
            isLoading={installmentsLoading}
            locale={locale}
            compact
          />
        </div>
      )}

      <div className="space-y-6">
        <h4 className="text-xs font-black uppercase tracking-wider text-neutral-600 px-2">
          {splitCards ? 'Cartão 1' : 'Cartão de Pagamento'}
        </h4>

        {savedCards.length > 0 && (
          <SavedCardList
            savedCards={savedCards}
            selectedId={selectedSavedCardId}
            excludeId={splitCards ? selectedSavedCardId2 : null}
            onSelect={setSelectedSavedCardId}
            onDeselect={handleDeselectCard1Fields}
          />
        )}

        {!selectedSavedCardId && (
          <CardFields
            cardNumber={cardNumber}
            setCardNumber={setCardNumber}
            cardName={cardName}
            setCardName={setCardName}
            cardExpiry={cardExpiry}
            setCardExpiry={setCardExpiry}
            cardCvc={cardCvc}
            setCardCvc={setCardCvc}
            formatCardNumber={formatCardNumber}
            formatExpiry={formatExpiry}
            formatCvc={formatCvc}
            showSaveToggle={!!currentUser}
            saveCardForFuture={saveCardForFuture}
            onToggleSave={handleToggleSave}
          />
        )}
      </div>

      {splitCards && finalTotal >= 500 && (
        <div className="space-y-6 pt-6 border-t border-neutral-200">
          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-600 px-2">Cartão 2</h4>

          {savedCards.length > 0 && (
            <SavedCardList
              savedCards={savedCards}
              selectedId={selectedSavedCardId2}
              excludeId={selectedSavedCardId}
              onSelect={setSelectedSavedCardId2}
              onDeselect={handleDeselectCard2Fields}
            />
          )}

          {!selectedSavedCardId2 && (
            <CardFields
              cardNumber={cardNumber2}
              setCardNumber={setCardNumber2}
              cardName={cardName2}
              setCardName={setCardName2}
              cardExpiry={cardExpiry2}
              setCardExpiry={setCardExpiry2}
              cardCvc={cardCvc2}
              setCardCvc={setCardCvc2}
              formatCardNumber={formatCardNumber}
              formatExpiry={formatExpiry}
              formatCvc={formatCvc}
              showSaveToggle={false}
              saveCardForFuture={false}
              onToggleSave={() => undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}
