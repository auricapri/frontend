/**
 * Shared types for checkout hooks
 */

import type { PaymentMethod } from '../../../constants/enums';
import type { Locale } from '../../../i18n';
import type {
  AddressData,
  CartItem,
  Coupon,
  InternalLogisticsInfo,
  MapboxFeature,
  SavedAddress,
  StoreConfig,
  UserMode as UserModeType,
  UserProfile,
} from '../../../types';
import type { InstallmentOption, PixData, BoletoData, PaymentResponse } from '../../../types/payment.types';
import type { ShippingCalculationState } from './useShippingCalculation';

// ============================================================================
// Core Types
// ============================================================================

export type OnCompleteCallback = (
  address: AddressData,
  logistics: InternalLogisticsInfo,
  paymentMethod: PaymentMethod,
  finalAmount: number,
  saveCard: boolean,
  cardToken?: string,
  phone?: string,
  cashbackUsed?: number
) => void;

export interface CustomerPaymentInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
}

// ============================================================================
// useCheckoutTotals Types
// ============================================================================

export interface UseCheckoutTotalsParams {
  items: CartItem[];
  manualCouponDiscount: number;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  availableCashback: number;
  useCashback: boolean;
}

export interface UseCheckoutTotalsReturn {
  subtotal: number;
  originalSubtotal: number;
  preAppliedDiscount: number;
  quantityDiscount: number;
  discountedSubtotal: number;
  pixDiscount: number;
  totalBeforeWallet: number;
  cashbackUsed: number;
  finalTotal: number;
}

// ============================================================================
// useCouponState Types
// ============================================================================

export interface UseCouponStateParams {
  items: CartItem[];
  locale: Locale;
}

export interface UseCouponStateReturn {
  couponCode: string;
  setCouponCode: (code: string) => void;
  couponLoading: boolean;
  couponError: string | null;
  appliedCoupon: Coupon | null;
  checkoutItems: CartItem[];
  itemsWithCoupon: CartItem[];
  itemsWithoutCoupon: CartItem[];
  manualCouponDiscount: number;
  handleApplyCoupon: () => Promise<void>;
  handleRemoveCoupon: () => void;
}

// ============================================================================
// useCreditCardState Types
// ============================================================================

export interface UseCreditCardStateParams {
  currentUser: UserProfile | null;
  splitCards: boolean;
}

export interface UseCreditCardStateReturn {
  // Card 1
  cardNumber: string;
  setCardNumber: (value: string) => void;
  cardName: string;
  setCardName: (value: string) => void;
  cardExpiry: string;
  setCardExpiry: (value: string) => void;
  cardCvc: string;
  setCardCvc: (value: string) => void;

  // Card 2 (for split)
  cardNumber2: string;
  setCardNumber2: (value: string) => void;
  cardName2: string;
  setCardName2: (value: string) => void;
  cardExpiry2: string;
  setCardExpiry2: (value: string) => void;
  cardCvc2: string;
  setCardCvc2: (value: string) => void;

  // Saved cards
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

  // Reset
  resetCards: () => void;
}

// ============================================================================
// useInstallmentState Types
// ============================================================================

export interface UseInstallmentStateParams {
  finalTotal: number;
  paymentMethod: PaymentMethod;
  isInfluencerCoupon: boolean;
}

export interface UseInstallmentStateReturn {
  // Split cards toggle
  splitCards: boolean;
  setSplitCards: (split: boolean) => void;

  // Single card installments
  installmentOptions: InstallmentOption[];
  selectedInstallments: number;
  selectedInstallmentCode: string;
  selectedInstallmentOption: InstallmentOption | undefined;
  installmentsLoading: boolean;
  handleSelectInstallments: (installments: number, code: string) => void;

  // Split card amounts
  card1Amount: number;
  card2Amount: number;
  handleCard1AmountChange: (amount: number) => void;
  handleCard2AmountChange: (amount: number) => void;

  // Split card installments
  card1Installments: number;
  card1InstallmentCode: string;
  card1Options: InstallmentOption[];
  card2Installments: number;
  card2InstallmentCode: string;
  card2Options: InstallmentOption[];
  handleSelectCard1Installments: (installments: number, code: string) => void;
  handleSelectCard2Installments: (installments: number, code: string) => void;

  // Validation
  splitCardsValid: boolean;

  // Computed total with fees
  finalTotalWithFees: number;
}

// ============================================================================
// useAddressState Types
// ============================================================================

export interface UseAddressStateParams {
  currentUser: UserProfile | null;
  shipping: ShippingCalculationState;
}

export interface UseAddressStateReturn {
  // CEP state
  cep: string;
  setCep: (cep: string) => void;
  loadingCep: boolean;
  cepError: string | null;
  handleCepChange: (val: string) => void;

  // Address form
  address: AddressData | null;
  setAddress: (address: AddressData | null) => void;
  num: string;
  setNum: (num: string) => void;
  complement: string;
  setComplement: (complement: string) => void;

  // Contact info
  recipientName: string;
  setRecipientName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  cpf: string;
  setCpf: (cpf: string) => void;
  cpfError: string | null;

  // Saved addresses
  userAddresses: SavedAddress[];
  selectedAddressId: string | null;
  loadingAddresses: boolean;
  handleSelectSavedAddress: (addressId: string) => void;

  // Flags
  addressLoaded: boolean;
  setAddressLoaded: (loaded: boolean) => void;
  isManualAddress: boolean;
  setIsManualAddress: (manual: boolean) => void;
  hasUserEditedCep: boolean;
}

// ============================================================================
// useMapPicker Types
// ============================================================================

export interface ManualAddressState {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

export interface UseMapPickerParams {
  addressState: UseAddressStateReturn;
  shipping: ShippingCalculationState;
}

export interface UseMapPickerReturn {
  // Modal state
  isMapPickerOpen: boolean;
  setIsMapPickerOpen: (open: boolean) => void;

  // Map state
  mapboxLoaded: boolean;
  mapError: boolean;

  // Refs
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  pickerContainerRef: React.RefObject<HTMLDivElement | null>;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchQueryChange: (query: string) => void;
  isSearching: boolean;
  searchResults: MapboxFeature[];
  handlePickerSearch: () => Promise<void>;
  handleSelectSearchResult: (result: MapboxFeature) => Promise<void>;

  // Manual address form (inside modal)
  manualAddress: ManualAddressState;
  setManualAddress: (addr: ManualAddressState) => void;
  manualCepError: string | null;
  confirmManualAddress: () => Promise<void>;
}

// ============================================================================
// usePixBoletoState Types
// ============================================================================

export interface UsePixBoletoStateParams {
  currentUser: UserProfile | null;
  address: AddressData | null;
  phone: string;
  cpf: string;
  num: string;
  complement: string;
  items: CartItem[];
  subtotal: number;
  finalTotal: number;
  cashbackUsed: number;
  shipping: ShippingCalculationState;
  userMode: UserModeType;
  paymentMethod: PaymentMethod;
  onComplete: OnCompleteCallback;
  saveCardForFuture: boolean;
  step: number;
  setStep: (step: number) => void;
}

export interface UsePixBoletoStateReturn {
  // PIX state
  pixData: PixData | null;
  pixLoading: boolean;
  pixError: string | null;
  createPixCharge: (orderId: string, customerInfo: CustomerPaymentInfo) => Promise<boolean>;

  // Boleto state
  boletoData: BoletoData | null;
  boletoLoading: boolean;
  boletoError: string | null;
  createBoletoCharge: (orderId: string, customerInfo: CustomerPaymentInfo) => Promise<PaymentResponse>;

  // General
  paymentProcessing: boolean;
  setPaymentProcessing: (processing: boolean) => void;
  resetPaymentData: () => void;
  completeOrderWithPayment: (overridePaymentMethod?: PaymentMethod) => Promise<any>;
}

// Re-export types for convenience
export type {
  AddressData,
  CartItem,
  Coupon,
  InternalLogisticsInfo,
  InstallmentOption,
  Locale,
  MapboxFeature,
  PaymentMethod,
  PixData,
  BoletoData,
  SavedAddress,
  StoreConfig,
  UserModeType,
  UserProfile,
};
