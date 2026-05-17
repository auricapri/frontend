/**
 * useCheckoutState - Orchestrator hook that composes all checkout-related hooks
 *
 * This hook maintains the same external API as before refactoring,
 * but internally delegates to smaller, focused hooks.
 */

import { useEffect, useMemo, useState } from 'react';
import { PaymentMethod } from '../../../constants/enums';
import { Locale } from '../../../i18n';
import { maskCPF, maskPhone, unmask } from '../../../utils/masks';
import { LogisticsService } from '../../../services/logistics.service';
import type {
  AddressData,
  CartItem,
  InternalLogisticsInfo,
  LocalizedText,
  StoreConfig,
  UserMode as UserModeType,
  UserProfile,
} from '../../../types';
import { UserMode } from '../../../types';
import { usePaymentProcessing } from './usePaymentProcessing';
import { computeAccessoryBundleDiscount } from '../../../utils/product';
import type { Product } from '../../../types';
import { useShippingCalculation } from './useShippingCalculation';
import { useCheckoutTotals } from './useCheckoutTotals';
import { useCreditCardState } from './useCreditCardState';
import { useInstallmentState } from './useInstallmentState';
import { useAddressState } from './useAddressState';
import { useMapPicker } from './useMapPicker';
import { usePixBoletoState } from './usePixBoletoState';

export type UseCheckoutStateParams = {
  items: CartItem[];
  currentUser: UserProfile | null;
  storeConfig?: StoreConfig;
  userMode: UserModeType;
  onComplete: (
    address: AddressData,
    logistics: InternalLogisticsInfo,
    paymentMethod: PaymentMethod,
    finalAmount: number,
    saveCard: boolean,
    cardToken?: string,
    phone?: string,
    cashbackUsed?: number
  ) => void;
  onPixPaymentConfirmed?: () => void;
  locale: Locale;
  initialStep?: number;
  products?: Product[];
};

export function useCheckoutState(params: UseCheckoutStateParams) {
  const { items, currentUser, storeConfig, userMode, onComplete, onPixPaymentConfirmed, locale, initialStep, products = [] } = params;

  // Step management
  const [step, setStep] = useState(initialStep ?? 1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);
  const [useCashback, setUseCashback] = useState(false);

  // Logistics service — stable reference to avoid recreating shipping callbacks on every render
  const logisticsService = useMemo(() => new LogisticsService(), []);

  // Compose hooks - shipping first as other hooks depend on it
  const shipping = useShippingCalculation({ logisticsService, userMode, address: null });

  // Address state
  const addressState = useAddressState({
    currentUser,
    shipping,
  });

  // Update shipping when address changes
  useEffect(() => {
    if (addressState.address) {
      // Shipping is updated via addressState.handleCepChange or handleSelectSavedAddress
    }
  }, [addressState.address]);

  // Map picker
  const mapPicker = useMapPicker({
    addressState,
    shipping,
  });

  // Familia coupon: frete sempre zero quando ativo
  const isFamiliaActive = !!sessionStorage.getItem('familia_coupon_code');

  // Calculate shipping cost
  const shippingCost = isFamiliaActive
    ? 0
    : userMode === UserMode.ATACADO && shipping.selectedShippingOption
    ? shipping.selectedShippingOption.display_price_was
    : userMode !== UserMode.ATACADO &&
      shipping.selectedVarejoShipping === 'express' &&
      shipping.expressOption
    ? shipping.expressOption.real_cost
    : userMode !== UserMode.ATACADO && shipping.selectedVarejoCarrierOption
    ? shipping.selectedVarejoCarrierOption.real_cost
    : 0;

  // Accessory bundle discount
  const bundleDiscount = useMemo(
    () => computeAccessoryBundleDiscount(items, products),
    [items, products]
  );

  // Totals
  const totals = useCheckoutTotals({
    items,
    bundleDiscount,
    shippingCost,
    paymentMethod,
    availableCashback: currentUser?.loyalty?.cashback_balance || 0,
    useCashback,
    userMode,
  });

  // Installments
  const installment = useInstallmentState({
    finalTotal: totals.finalTotal,
    paymentMethod,
  });

  // Credit card state
  const creditCard = useCreditCardState({
    currentUser,
    splitCards: installment.splitCards,
  });

  // PIX/Boleto state
  const pixBoleto = usePixBoletoState({
    currentUser,
    address: addressState.address,
    phone: addressState.phone,
    cpf: addressState.cpf,
    num: addressState.num,
    complement: addressState.complement,
    items,
    subtotal: totals.subtotal,
    finalTotal: totals.finalTotal,
    cashbackUsed: totals.cashbackUsed,
    shipping,
    userMode,
    paymentMethod,
    onComplete,
    saveCardForFuture: creditCard.saveCardForFuture,
    step,
    setStep,
    onPixPaymentConfirmed,
    // Credit card data for payment processing
    cardData: creditCard.cardNumber ? {
      holderName: creditCard.cardName,
      number: creditCard.cardNumber,
      expiryMonth: creditCard.cardExpiry.split('/')[0] || '',
      expiryYear: creditCard.cardExpiry.split('/')[1]
        ? '20' + creditCard.cardExpiry.split('/')[1]
        : '',
      cvv: creditCard.cardCvc,
    } : null,
    cardToken: creditCard.selectedSavedCardId
      ? currentUser?.saved_cards?.find((c) => c.id === creditCard.selectedSavedCardId)?.gateway_token ?? null
      : null,
    selectedInstallments: installment.selectedInstallments,
    selectedInstallmentCode: installment.selectedInstallmentCode,
  });

  // Payment processing
  const payment = usePaymentProcessing({
    items,
    currentUser,
    storeConfig,
    userMode,
    address: addressState.address,
    num: addressState.num,
    complement: addressState.complement,
    phone: addressState.phone,
    paymentMethod,
    finalTotal: totals.finalTotal,
    saveCardForFuture: creditCard.saveCardForFuture,
    selectedSavedCardId: creditCard.selectedSavedCardId,
    bestInternalShipping: shipping.bestInternalShipping,
    selectedShippingOption: shipping.selectedShippingOption,
    onComplete,
    cashbackUsed: totals.cashbackUsed,
    pixData: pixBoleto.pixData,
    boletoData: pixBoleto.boletoData,
  });

  // Scroll to top on step change
  useEffect(() => {
    const mainContainer = document.getElementById('main-content');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  // Localization helper
  const getLoc = (obj: LocalizedText | string | null | undefined) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || '';
  };

  // Return unified API (same shape as before)
  return {
    // Core
    currentUser,
    userMode,
    locale,
    step,
    setStep,
    items,

    // Address state
    cep: addressState.cep,
    setCep: addressState.setCep,
    address: addressState.address,
    setAddress: addressState.setAddress,
    loadingCep: addressState.loadingCep,
    num: addressState.num,
    setNum: addressState.setNum,
    complement: addressState.complement,
    setComplement: addressState.setComplement,
    recipientName: addressState.recipientName,
    setRecipientName: addressState.setRecipientName,
    phone: addressState.phone,
    setPhone: addressState.setPhone,
    cpf: addressState.cpf,
    setCpf: addressState.setCpf,
    cpfError: addressState.cpfError,
    cepError: addressState.cepError,
    addressLoaded: addressState.addressLoaded,
    setAddressLoaded: addressState.setAddressLoaded,
    isManualAddress: addressState.isManualAddress,
    setIsManualAddress: addressState.setIsManualAddress,
    handleCepChange: addressState.handleCepChange,

    // Saved addresses
    userAddresses: addressState.userAddresses,
    selectedAddressId: addressState.selectedAddressId,
    loadingAddresses: addressState.loadingAddresses,
    handleSelectSavedAddress: addressState.handleSelectSavedAddress,

    // Map picker
    mapError: mapPicker.mapError,
    mapboxLoaded: mapPicker.mapboxLoaded,
    isMapPickerOpen: mapPicker.isMapPickerOpen,
    setIsMapPickerOpen: mapPicker.setIsMapPickerOpen,
    mapContainerRef: mapPicker.mapContainerRef,
    pickerContainerRef: mapPicker.pickerContainerRef,
    searchQuery: mapPicker.searchQuery,
    setSearchQuery: mapPicker.setSearchQuery,
    isSearching: mapPicker.isSearching,
    searchResults: mapPicker.searchResults,
    handlePickerSearch: mapPicker.handlePickerSearch,
    handleSearchQueryChange: mapPicker.handleSearchQueryChange,
    handleSelectSearchResult: mapPicker.handleSelectSearchResult,
    manualAddress: mapPicker.manualAddress,
    setManualAddress: mapPicker.setManualAddress,
    manualCepError: mapPicker.manualCepError,
    confirmManualAddress: mapPicker.confirmManualAddress,

    // Shipping
    shipping,

    // Payment method
    paymentMethod,
    setPaymentMethod,

    // Cashback
    useCashback,
    setUseCashback,
    availableCashback: currentUser?.loyalty?.cashback_balance || 0,

    // Credit card
    cardNumber: creditCard.cardNumber,
    setCardNumber: creditCard.setCardNumber,
    cardName: creditCard.cardName,
    setCardName: creditCard.setCardName,
    cardExpiry: creditCard.cardExpiry,
    setCardExpiry: creditCard.setCardExpiry,
    cardCvc: creditCard.cardCvc,
    setCardCvc: creditCard.setCardCvc,
    cardNumber2: creditCard.cardNumber2,
    setCardNumber2: creditCard.setCardNumber2,
    cardName2: creditCard.cardName2,
    setCardName2: creditCard.setCardName2,
    cardExpiry2: creditCard.cardExpiry2,
    setCardExpiry2: creditCard.setCardExpiry2,
    cardCvc2: creditCard.cardCvc2,
    setCardCvc2: creditCard.setCardCvc2,
    selectedSavedCardId: creditCard.selectedSavedCardId,
    setSelectedSavedCardId: creditCard.setSelectedSavedCardId,
    selectedSavedCardId2: creditCard.selectedSavedCardId2,
    setSelectedSavedCardId2: creditCard.setSelectedSavedCardId2,
    saveCardForFuture: creditCard.saveCardForFuture,
    setSaveCardForFuture: creditCard.setSaveCardForFuture,
    formatCardNumber: creditCard.formatCardNumber,
    formatExpiry: creditCard.formatExpiry,
    formatCvc: creditCard.formatCvc,

    // Installments
    splitCards: installment.splitCards,
    setSplitCards: installment.setSplitCards,
    installmentOptions: installment.installmentOptions,
    selectedInstallments: installment.selectedInstallments,
    selectedInstallmentCode: installment.selectedInstallmentCode,
    selectedInstallmentOption: installment.selectedInstallmentOption,
    installmentsLoading: installment.installmentsLoading,
    handleSelectInstallments: installment.handleSelectInstallments,
    card1Amount: installment.card1Amount,
    card2Amount: installment.card2Amount,
    card1Installments: installment.card1Installments,
    card1InstallmentCode: installment.card1InstallmentCode,
    card1Options: installment.card1Options,
    card2Installments: installment.card2Installments,
    card2InstallmentCode: installment.card2InstallmentCode,
    card2Options: installment.card2Options,
    splitCardsValid: installment.splitCardsValid,
    handleCard1AmountChange: installment.handleCard1AmountChange,
    handleCard2AmountChange: installment.handleCard2AmountChange,
    handleSelectCard1Installments: installment.handleSelectCard1Installments,
    handleSelectCard2Installments: installment.handleSelectCard2Installments,
    finalTotalWithFees: installment.finalTotalWithFees,

    // Totals
    subtotal: totals.subtotal,
    originalSubtotal: totals.originalSubtotal,
    preAppliedDiscount: totals.preAppliedDiscount,
    quantityDiscount: totals.quantityDiscount,
    bundleDiscount: totals.bundleDiscount,
    shippingCost,
    pixDiscount: totals.pixDiscount,
    cashbackUsed: totals.cashbackUsed,
    finalTotal: totals.finalTotal,

    // PIX/Boleto
    pixData: pixBoleto.pixData,
    pixLoading: pixBoleto.pixLoading,
    pixError: pixBoleto.pixError,
    boletoData: pixBoleto.boletoData,
    boletoLoading: pixBoleto.boletoLoading,
    boletoError: pixBoleto.boletoError,
    creditCardError: pixBoleto.creditCardError,
    paymentProcessing: pixBoleto.paymentProcessing,
    setPaymentProcessing: pixBoleto.setPaymentProcessing,
    createPixCharge: pixBoleto.createPixCharge,
    createBoletoCharge: pixBoleto.createBoletoCharge,
    resetPaymentData: pixBoleto.resetPaymentData,
    completeOrderWithPayment: pixBoleto.completeOrderWithPayment,

    // Payment processing
    payment,

    // Utilities
    getLoc,
    maskPhone,
    maskCPF,
    unmask,
  };
}

export type CheckoutState = ReturnType<typeof useCheckoutState>;
