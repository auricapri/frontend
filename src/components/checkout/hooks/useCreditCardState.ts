/**
 * useCreditCardState - Manages credit card form inputs, formatting, and saved card selection
 */

import { useCallback, useState } from 'react';
import { maskCreditCard, maskExpiryDate } from '../../../utils/masks';
import type { UseCreditCardStateParams, UseCreditCardStateReturn } from './types';

export function useCreditCardState(_params: UseCreditCardStateParams): UseCreditCardStateReturn {
  // Card 1 state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Card 2 state (for split payments)
  const [cardNumber2, setCardNumber2] = useState('');
  const [cardName2, setCardName2] = useState('');
  const [cardExpiry2, setCardExpiry2] = useState('');
  const [cardCvc2, setCardCvc2] = useState('');

  // Saved cards state
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | null>(null);
  const [selectedSavedCardId2, setSelectedSavedCardId2] = useState<string | null>(null);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);

  // Formatters
  const formatCardNumber = useCallback((value: string): string => {
    return maskCreditCard(value);
  }, []);

  const formatExpiry = useCallback((value: string): string => {
    return maskExpiryDate(value);
  }, []);

  const formatCvc = useCallback((value: string): string => {
    return value.replace(/\D/g, '').slice(0, 4);
  }, []);

  // Reset all card fields
  const resetCards = useCallback(() => {
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvc('');
    setCardNumber2('');
    setCardName2('');
    setCardExpiry2('');
    setCardCvc2('');
    setSelectedSavedCardId(null);
    setSelectedSavedCardId2(null);
    setSaveCardForFuture(false);
  }, []);

  return {
    // Card 1
    cardNumber,
    setCardNumber,
    cardName,
    setCardName,
    cardExpiry,
    setCardExpiry,
    cardCvc,
    setCardCvc,

    // Card 2
    cardNumber2,
    setCardNumber2,
    cardName2,
    setCardName2,
    cardExpiry2,
    setCardExpiry2,
    cardCvc2,
    setCardCvc2,

    // Saved cards
    selectedSavedCardId,
    setSelectedSavedCardId,
    selectedSavedCardId2,
    setSelectedSavedCardId2,
    saveCardForFuture,
    setSaveCardForFuture,

    // Formatters
    formatCardNumber,
    formatExpiry,
    formatCvc,

    // Reset
    resetCards,
  };
}
