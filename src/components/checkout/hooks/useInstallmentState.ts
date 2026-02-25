/**
 * useInstallmentState - Manages installment options loading and split card amounts
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PaymentMethod } from '../../../constants/enums';
import { PaymentsApi } from '../../../api/payments.api';
import type { InstallmentOption, UseInstallmentStateParams, UseInstallmentStateReturn } from './types';

export function useInstallmentState(params: UseInstallmentStateParams): UseInstallmentStateReturn {
  const { finalTotal, paymentMethod } = params;

  const paymentsApi = useMemo(() => new PaymentsApi(), []);

  // Split cards toggle
  const [splitCards, setSplitCards] = useState(false);

  // Single card installments
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [selectedInstallmentCode, setSelectedInstallmentCode] = useState('INST_1');
  const [installmentsLoading, setInstallmentsLoading] = useState(false);

  // Split card amounts
  const [card1Amount, setCard1Amount] = useState<number>(0);
  const [card2Amount, setCard2Amount] = useState<number>(0);

  // Split card installments
  const [card1Installments, setCard1Installments] = useState(1);
  const [card1InstallmentCode, setCard1InstallmentCode] = useState('INST_1');
  const [card1Options, setCard1Options] = useState<InstallmentOption[]>([]);
  const [card2Installments, setCard2Installments] = useState(1);
  const [card2InstallmentCode, setCard2InstallmentCode] = useState('INST_1');
  const [card2Options, setCard2Options] = useState<InstallmentOption[]>([]);

  // Auto-split amounts when splitCards is toggled
  useEffect(() => {
    if (splitCards && finalTotal > 0) {
      const half = parseFloat((finalTotal / 2).toFixed(2));
      setCard1Amount(half);
      setCard2Amount(parseFloat((finalTotal - half).toFixed(2)));
    } else {
      setCard1Amount(finalTotal);
      setCard2Amount(0);
    }
  }, [splitCards, finalTotal]);

  // Load installment options for single card
  const loadInstallmentOptions = useCallback(async (amount: number) => {
    if (amount <= 0) {
      setInstallmentOptions([]);
      return;
    }

    setInstallmentsLoading(true);
    try {
      const response = await paymentsApi.getInstallmentOptions(amount);
      setInstallmentOptions(response.options);
      // Reset to 1x if current selection is invalid
      if (selectedInstallments > response.maxInstallments) {
        setSelectedInstallments(1);
        setSelectedInstallmentCode('INST_1');
      }
    } catch (error) {
      console.error('Failed to load installment options:', error);
      setInstallmentOptions([]);
    } finally {
      setInstallmentsLoading(false);
    }
  }, [paymentsApi, selectedInstallments]);

  // Load split card options
  const loadSplitCardOptions = useCallback(async () => {
    if (!splitCards || card1Amount <= 0 || card2Amount <= 0) return;

    try {
      const [card1Response, card2Response] = await Promise.all([
        paymentsApi.getInstallmentOptions(card1Amount),
        paymentsApi.getInstallmentOptions(card2Amount)
      ]);

      setCard1Options(card1Response.options);
      setCard2Options(card2Response.options);

      // Reset installments if invalid
      if (card1Installments > card1Response.maxInstallments) {
        setCard1Installments(1);
        setCard1InstallmentCode('INST_1');
      }
      if (card2Installments > card2Response.maxInstallments) {
        setCard2Installments(1);
        setCard2InstallmentCode('INST_1');
      }
    } catch (error) {
      console.error('Failed to load split card options:', error);
    }
  }, [splitCards, card1Amount, card2Amount, card1Installments, card2Installments, paymentsApi]);

  // Effect to load installment options for single card
  useEffect(() => {
    if (paymentMethod === PaymentMethod.CREDIT_CARD && !splitCards && finalTotal > 0) {
      loadInstallmentOptions(finalTotal);
    }
  }, [paymentMethod, splitCards, finalTotal, loadInstallmentOptions]);

  // Effect to load split card options
  useEffect(() => {
    if (paymentMethod === PaymentMethod.CREDIT_CARD && splitCards) {
      loadSplitCardOptions();
    }
  }, [paymentMethod, splitCards, card1Amount, card2Amount, loadSplitCardOptions]);

  // Handle installment selection
  const handleSelectInstallments = useCallback((installments: number, code: string) => {
    setSelectedInstallments(installments);
    setSelectedInstallmentCode(code);
  }, []);

  // Handle card 1 installment selection
  const handleSelectCard1Installments = useCallback((installments: number, code: string) => {
    setCard1Installments(installments);
    setCard1InstallmentCode(code);
  }, []);

  // Handle card 2 installment selection
  const handleSelectCard2Installments = useCallback((installments: number, code: string) => {
    setCard2Installments(installments);
    setCard2InstallmentCode(code);
  }, []);

  // Handle card 1 amount change
  const handleCard1AmountChange = useCallback((amount: number) => {
    setCard1Amount(parseFloat(amount.toFixed(2)));
  }, []);

  // Handle card 2 amount change
  const handleCard2AmountChange = useCallback((amount: number) => {
    setCard2Amount(parseFloat(amount.toFixed(2)));
  }, []);

  // Validation for split cards
  const splitCardsValid = useMemo(() => {
    if (!splitCards) return true;
    const difference = Math.abs(parseFloat((card1Amount + card2Amount - finalTotal).toFixed(2)));
    return difference < 0.02; // 2 centavos de tolerância
  }, [splitCards, card1Amount, card2Amount, finalTotal]);

  // Selected installment option
  const selectedInstallmentOption = useMemo(() => {
    return installmentOptions.find(o => o.installments === selectedInstallments);
  }, [installmentOptions, selectedInstallments]);

  // Calculate final amount with fees for credit card
  const finalTotalWithFees = useMemo(() => {
    if (paymentMethod !== PaymentMethod.CREDIT_CARD) {
      return finalTotal;
    }

    if (splitCards) {
      const card1Option = card1Options.find(o => o.installments === card1Installments);
      const card2Option = card2Options.find(o => o.installments === card2Installments);
      return (card1Option?.totalValue || card1Amount) + (card2Option?.totalValue || card2Amount);
    }

    return selectedInstallmentOption?.totalValue || finalTotal;
  }, [
    paymentMethod,
    splitCards,
    selectedInstallmentOption,
    card1Options,
    card2Options,
    card1Installments,
    card2Installments,
    card1Amount,
    card2Amount,
    finalTotal
  ]);

  return {
    // Split cards toggle
    splitCards,
    setSplitCards,

    // Single card installments
    installmentOptions,
    selectedInstallments,
    selectedInstallmentCode,
    selectedInstallmentOption,
    installmentsLoading,
    handleSelectInstallments,

    // Split card amounts
    card1Amount,
    card2Amount,
    handleCard1AmountChange,
    handleCard2AmountChange,

    // Split card installments
    card1Installments,
    card1InstallmentCode,
    card1Options,
    card2Installments,
    card2InstallmentCode,
    card2Options,
    handleSelectCard1Installments,
    handleSelectCard2Installments,

    // Validation
    splitCardsValid,

    // Computed total with fees
    finalTotalWithFees,
  };
}
