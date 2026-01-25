import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaymentMethod } from '../../../constants/enums';
import { Locale } from '../../../i18n';
import { CouponsApi } from '../../../api/coupons.api';
import { PaymentsApi } from '../../../api/payments.api';
import { OrdersApi } from '../../../api/orders.api';
import { UsersApi } from '../../../api/users.api';
import { formatCurrency } from '../../../utils/currency';
import { MAPBOX_TOKEN, getMapboxStyle } from '../../../utils/mapbox';
import { maskCep, maskCPF, maskCreditCard, maskExpiryDate, maskPhone, normalizeCepDigits, unmask } from '../../../utils/masks';
import { LogisticsService } from '../../../services/logistics.service';
import type { InstallmentOption, PixData, BoletoData } from '../../../types/payment.types';
import {
  AddressData,
  type CartItem,
  type Coupon,
  type InternalLogisticsInfo,
  type LocalizedText,
  type MapboxFeature,
  type StoreConfig,
  UserMode,
  type UserMode as UserModeType,
  type UserProfile,
  type SavedAddress,
} from '../../../types';
import { usePaymentProcessing } from './usePaymentProcessing';
import { useShippingCalculation } from './useShippingCalculation';

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
    phone?: string
  ) => void;
  locale: Locale;
};

export function useCheckoutState(params: UseCheckoutStateParams) {
  const { items, currentUser, storeConfig, userMode, onComplete, locale } = params;

  const logisticsService = useMemo(() => new LogisticsService(), []);
  const couponsApi = useMemo(() => new CouponsApi(), []);
  const paymentsApi = useMemo(() => new PaymentsApi(), []);
  const ordersApi = useMemo(() => new OrdersApi(), []);
  const usersApi = useMemo(() => new UsersApi(), []);

  const [step, setStep] = useState(1);
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState<AddressData | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [hasUserEditedCep, setHasUserEditedCep] = useState(false);

  const shipping = useShippingCalculation({ logisticsService, userMode, address });

  const [mapError, setMapError] = useState(false);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [num, setNum] = useState('');
  const [complement, setComplement] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState(currentUser?.cpf || '');
  const [cepError, setCepError] = useState<string | null>(null);

  // Atualizar CPF quando currentUser mudar (ex: após login)
  useEffect(() => {
    if (currentUser?.cpf && !cpf) {
      setCpf(currentUser.cpf);
    }
  }, [currentUser?.cpf]);
  const [manualCepError, setManualCepError] = useState<string | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [isManualAddress, setIsManualAddress] = useState(false);

  // Saved addresses state
  const [userAddresses, setUserAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);
  const [splitCards, setSplitCards] = useState(false);
  const [card1Amount, setCard1Amount] = useState<number>(0);
  const [card2Amount, setCard2Amount] = useState<number>(0);
  const [useCashback, setUseCashback] = useState(false);

  // Installment states
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [selectedInstallmentCode, setSelectedInstallmentCode] = useState('INST_1');
  const [installmentsLoading, setInstallmentsLoading] = useState(false);

  // Split card installment states
  const [card1Installments, setCard1Installments] = useState(1);
  const [card1InstallmentCode, setCard1InstallmentCode] = useState('INST_1');
  const [card1Options, setCard1Options] = useState<InstallmentOption[]>([]);
  const [card2Installments, setCard2Installments] = useState(1);
  const [card2InstallmentCode, setCard2InstallmentCode] = useState('INST_1');
  const [card2Options, setCard2Options] = useState<InstallmentOption[]>([]);

  // PIX payment states
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);

  // Boleto payment states
  const [boletoData, setBoletoData] = useState<BoletoData | null>(null);
  const [boletoLoading, setBoletoLoading] = useState(false);
  const [boletoError, setBoletoError] = useState<string | null>(null);

  // General payment processing state
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | null>(null);
  const [selectedSavedCardId2, setSelectedSavedCardId2] = useState<string | null>(null);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [cardNumber2, setCardNumber2] = useState('');
  const [cardName2, setCardName2] = useState('');
  const [cardExpiry2, setCardExpiry2] = useState('');
  const [cardCvc2, setCardCvc2] = useState('');

  const formatCardNumber = (value: string): string => maskCreditCard(value);
  const formatExpiry = (value: string): string => maskExpiryDate(value);
  const formatCvc = (value: string): string => value.replace(/\D/g, '').slice(0, 4);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>(items);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const pickerMapRef = useRef<any>(null);
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const pickerMarkerRef = useRef<any>(null);

  // Refs para debounce
  const cepDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MapboxFeature[]>([]);
  const [manualAddress, setManualAddress] = useState({
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
  });

  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const getLoc = (obj: LocalizedText | string | null | undefined) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || '';
  };

  useEffect(() => {
    setCheckoutItems(items);
  }, [items]);

  const itemsWithCoupon = useMemo(
    () => (Array.isArray(checkoutItems) ? checkoutItems : []).filter((item) => item?.applied_coupon_code),
    [checkoutItems]
  );

  const itemsWithoutCoupon = useMemo(
    () => (Array.isArray(checkoutItems) ? checkoutItems : []).filter((item) => !item?.applied_coupon_code),
    [checkoutItems]
  );

  const safeItems = Array.isArray(checkoutItems) ? checkoutItems : [];
  const subtotal = safeItems.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);
  const originalSubtotal = safeItems.reduce((sum, item) => {
    const originalPrice = item?.original_price || item?.price || 0;
    return sum + (originalPrice * (item?.quantity || 0));
  }, 0);

  const preAppliedDiscount = originalSubtotal - subtotal;

  const manualCouponDiscount = useMemo(() => {
    if (!appliedCoupon || itemsWithoutCoupon.length === 0) return 0;

    const eligibleSubtotal = itemsWithoutCoupon.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);

    if (appliedCoupon.discount_type === 'percentage') {
      return eligibleSubtotal * (appliedCoupon.discount_value / 100);
    }
    return Math.min(appliedCoupon.discount_value, eligibleSubtotal);
  }, [appliedCoupon, itemsWithoutCoupon]);

  const shippingCost = userMode === UserMode.ATACADO && shipping.selectedShippingOption ? shipping.selectedShippingOption.display_price_was : 0;
  const availableCashback = currentUser?.loyalty?.cashback_balance || 0;
  const totalBeforeDiscounts = subtotal - manualCouponDiscount + shippingCost;
  const pixDiscount = paymentMethod === PaymentMethod.PIX ? totalBeforeDiscounts * 0.05 : 0;
  const totalAfterPix = totalBeforeDiscounts - pixDiscount;
  const cashbackUsed = useCashback ? Math.min(availableCashback, Math.max(0, totalAfterPix)) : 0;
  const finalTotal = Math.max(0, totalAfterPix - cashbackUsed);

  useEffect(() => {
    if (splitCards && finalTotal > 0) {
      const half = Math.round((finalTotal / 2) * 100) / 100;
      setCard1Amount(half);
      setCard2Amount(Math.round((finalTotal - half) * 100) / 100);
    } else {
      setCard1Amount(finalTotal);
      setCard2Amount(0);
    }
  }, [splitCards, finalTotal]);

  // Load installment options when finalTotal changes
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

  // Effect to load installment options
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

  // Handle card 1 amount change for split (no clamping - validation is done in component)
  const handleCard1AmountChange = useCallback((amount: number) => {
    setCard1Amount(Math.round(amount * 100) / 100);
  }, []);

  // Handle card 2 amount change for split
  const handleCard2AmountChange = useCallback((amount: number) => {
    setCard2Amount(Math.round(amount * 100) / 100);
  }, []);

  // Create PIX charge - returns true if successful, false otherwise
  const createPixCharge = useCallback(async (orderId: string, customerInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
  }): Promise<boolean> => {
    setPixLoading(true);
    setPixError(null);
    try {
      console.log('[PIX] Criando cobrança para ordem:', orderId);
      const response = await paymentsApi.processPayment({
        orderId,
        method: 'pix',
        customerInfo
      });
      console.log('[PIX] Resposta do backend:', response);

      if (response.qrCodeImage && response.qrCodePayload && response.expiresAt) {
        setPixData({
          qrCodeImage: response.qrCodeImage,
          qrCodePayload: response.qrCodePayload,
          expiresAt: new Date(response.expiresAt),
          paymentId: response.paymentId
        });
        console.log('[PIX] pixData setado com sucesso');
        return true;
      } else {
        console.error('[PIX] Resposta incompleta:', {
          hasQrCodeImage: !!response.qrCodeImage,
          hasQrCodePayload: !!response.qrCodePayload,
          hasExpiresAt: !!response.expiresAt
        });
        setPixError('QR Code não foi gerado corretamente. Tente novamente.');
        return false;
      }
    } catch (error) {
      console.error('[PIX] Erro ao criar cobrança:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao gerar PIX';
      setPixError(errorMsg);
      return false;
    } finally {
      setPixLoading(false);
    }
  }, [paymentsApi]);

  // Create Boleto charge
  const createBoletoCharge = useCallback(async (orderId: string, customerInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
  }) => {
    setBoletoLoading(true);
    setBoletoError(null);
    try {
      const response = await paymentsApi.processPayment({
        orderId,
        method: 'boleto',
        customerInfo
      });
      if (response.barCode && response.bankSlipUrl && response.dueDate) {
        setBoletoData({
          barCode: response.barCode,
          bankSlipUrl: response.bankSlipUrl,
          dueDate: new Date(response.dueDate),
          paymentId: response.paymentId
        });
      }
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao gerar boleto';
      setBoletoError(errorMsg);
      throw error;
    } finally {
      setBoletoLoading(false);
    }
  }, [paymentsApi]);

  // Reset payment data
  const resetPaymentData = useCallback(() => {
    setPixData(null);
    setPixError(null);
    setBoletoData(null);
    setBoletoError(null);
  }, []);

  // Complete order flow: create order then process payment
  // overridePaymentMethod allows passing the payment method directly to avoid React state timing issues
  const completeOrderWithPayment = useCallback(async (overridePaymentMethod?: PaymentMethod) => {
    if (!address || !phone) {
      throw new Error('Endereço e telefone são obrigatórios');
    }

    // Use override payment method if provided (fixes race condition when setting state and calling immediately)
    const effectivePaymentMethod = overridePaymentMethod ?? paymentMethod;

    // Validate CPF for Asaas (usa CPF do perfil se disponível)
    const cpfValue = currentUser?.cpf || cpf;
    const cleanCpf = cpfValue.replace(/\D/g, '');
    if (!cleanCpf || cleanCpf.length !== 11) {
      const errorMsg = 'CPF é obrigatório para processar o pagamento';
      if (effectivePaymentMethod === PaymentMethod.PIX) {
        setPixError(errorMsg);
      } else if (effectivePaymentMethod === PaymentMethod.BOLETO) {
        setBoletoError(errorMsg);
      }
      throw new Error(errorMsg);
    }

    setPaymentProcessing(true);
    resetPaymentData();

    try {
      // Get shipping info
      const shippingToUse = userMode === UserMode.ATACADO && shipping.selectedShippingOption
        ? {
            selected_carrier: shipping.selectedShippingOption.provider,
            method: shipping.selectedShippingOption.method,
            real_cost: shipping.selectedShippingOption.real_cost,
            estimated_days: shipping.selectedShippingOption.estimated_days,
            display_price_was: shipping.selectedShippingOption.display_price_was,
            display_days_was: shipping.selectedShippingOption.display_days_was,
          }
        : shipping.bestInternalShipping;

      if (!shippingToUse) {
        throw new Error('Informações de frete não disponíveis');
      }

      const finalAddress = { ...address, numero: num, complemento: complement };

      // 1. Create order first
      const order = await ordersApi.create({
        items: items,
        addressData: finalAddress,
        logisticsInfo: shippingToUse,
        paymentMethod: effectivePaymentMethod,
        subtotal: subtotal,
        finalAmount: finalTotal,
      });

      // Salvar CPF no perfil se usuário não tem CPF salvo
      const cpfToUse = currentUser?.cpf || cpf;
      if (!currentUser?.cpf && cpf) {
        try {
          await usersApi.updateProfile({ cpf: cpf.replace(/\D/g, '') });
        } catch {
          // Silencioso - não bloquear checkout se falhar salvar CPF
          console.warn('Falha ao salvar CPF no perfil');
        }
      }

      // 2. Build customer info for payment
      const customerInfo = {
        name: currentUser?.full_name || currentUser?.name || '',
        email: currentUser?.email || '',
        cpfCnpj: cpfToUse.replace(/\D/g, ''),
        phone: phone.replace(/\D/g, ''),
        postalCode: address.cep?.replace(/\D/g, '') || '',
        addressNumber: num,
        addressComplement: complement || undefined,
      };

      // 3. Process payment based on method
      if (effectivePaymentMethod === PaymentMethod.PIX) {
        const pixSuccess = await createPixCharge(order.id, customerInfo);
        // Go back to payment step to show QR code only if PIX was created successfully
        // and we're not already on step 2 (auto-generation case)
        if (pixSuccess && step !== 2) {
          setStep(2);
        }
        // If failed, user stays on current step to see the error
      } else if (effectivePaymentMethod === PaymentMethod.BOLETO) {
        await createBoletoCharge(order.id, customerInfo);
        // Go back to payment step to show boleto (only if not already there)
        if (step !== 2) {
          setStep(2);
        }
      } else if (effectivePaymentMethod === PaymentMethod.CREDIT_CARD) {
        // For credit card, we need card data
        // This will be handled by the original onComplete flow
        onComplete(finalAddress, shippingToUse, effectivePaymentMethod, finalTotal, saveCardForFuture, undefined, phone);
      }

      return order;
    } catch (error) {
      console.error('Error completing order:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao processar pedido';
      if (effectivePaymentMethod === PaymentMethod.PIX) {
        setPixError(errorMsg);
      } else if (effectivePaymentMethod === PaymentMethod.BOLETO) {
        setBoletoError(errorMsg);
      }
      throw error;
    } finally {
      setPaymentProcessing(false);
    }
  }, [
    address,
    phone,
    userMode,
    shipping.selectedShippingOption,
    shipping.bestInternalShipping,
    num,
    complement,
    items,
    paymentMethod,
    subtotal,
    finalTotal,
    currentUser,
    cpf,
    ordersApi,
    usersApi,
    createPixCharge,
    createBoletoCharge,
    onComplete,
    saveCardForFuture,
    resetPaymentData,
    step,
  ]);

  // Validation for split cards
  const splitCardsValid = useMemo(() => {
    if (!splitCards) return true;
    const difference = Math.abs((card1Amount + card2Amount) - finalTotal);
    return difference < 0.01; // 1 centavo tolerance
  }, [splitCards, card1Amount, card2Amount, finalTotal]);

  // Calculate final amount with fees for credit card
  const selectedInstallmentOption = useMemo(() => {
    return installmentOptions.find(o => o.installments === selectedInstallments);
  }, [installmentOptions, selectedInstallments]);

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
  }, [paymentMethod, splitCards, selectedInstallmentOption, card1Options, card2Options, card1Installments, card2Installments, card1Amount, card2Amount, finalTotal]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const coupon = await couponsApi.getByCode(couponCode.trim().toUpperCase());

      if (!coupon) {
        setCouponError('Cupom inválido ou expirado');
        setCouponLoading(false);
        return;
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setCouponError('Este cupom expirou');
        setCouponLoading(false);
        return;
      }

      const eligibleSubtotal = itemsWithoutCoupon.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);

      if (coupon.min_purchase_amount && eligibleSubtotal < coupon.min_purchase_amount) {
        setCouponError(`Compra mínima de ${formatCurrency(coupon.min_purchase_amount, locale)} para itens elegíveis`);
        setCouponLoading(false);
        return;
      }

      if (coupon.product_ids && coupon.product_ids.length > 0) {
        const hasEligibleProduct = itemsWithoutCoupon.some((item) => coupon.product_ids?.includes(item.product_id));
        if (!hasEligibleProduct) {
          setCouponError('Este cupom não é válido para os produtos elegíveis');
          setCouponLoading(false);
          return;
        }
      }

      if (itemsWithoutCoupon.length === 0) {
        setCouponError('Todos os itens já possuem cupom aplicado');
        setCouponLoading(false);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponCode('');
    } catch {
      setCouponError('Erro ao validar cupom');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  useEffect(() => {
    if (currentUser?.phone && !phone) {
      setPhone(currentUser.phone);
    }
  }, [currentUser?.phone, phone]);

  // Load saved addresses when user is logged in
  useEffect(() => {
    if (currentUser?.id) {
      setLoadingAddresses(true);
      usersApi.getAddresses()
        .then((addresses) => {
          setUserAddresses(addresses || []);
        })
        .catch((err) => {
          // API may not be available yet - fail silently
          console.warn('Could not load addresses (API may not exist yet):', err.message);
          setUserAddresses([]);
        })
        .finally(() => {
          setLoadingAddresses(false);
        });
    }
  }, [currentUser?.id, usersApi]);

  // Handle selecting a saved address
  const handleSelectSavedAddress = useCallback((addressId: string) => {
    if (!addressId) {
      // New address - reset fields
      setSelectedAddressId(null);
      setAddress(null);
      setCep('');
      setNum('');
      setComplement('');
      setAddressLoaded(false);
      setHasUserEditedCep(true);
      shipping.resetShipping();
      return;
    }

    const selected = userAddresses.find(a => a.id === addressId);
    if (selected) {
      setSelectedAddressId(addressId);
      setHasUserEditedCep(true);

      // Extract number from street_address if present
      let extractedNum = '';
      let logradouro = selected.street_address || selected.line1 || '';

      if (logradouro) {
        const commaIndex = logradouro.lastIndexOf(',');
        if (commaIndex > 0) {
          const numPart = logradouro.substring(commaIndex + 1).trim();
          if (numPart && !isNaN(Number(numPart.replace(/\D/g, '')))) {
            extractedNum = numPart.replace(/\D/g, '');
            logradouro = logradouro.substring(0, commaIndex).trim();
          }
        }
      }

      const cepValue = selected.postal_code || '';
      const cleanedCep = cepValue.replace(/\D/g, '');
      const formattedCep = cleanedCep.length === 8
        ? cleanedCep.substring(0, 5) + '-' + cleanedCep.substring(5, 8)
        : cepValue;

      setAddress({
        logradouro: logradouro,
        bairro: selected.neighborhood || selected.line2 || '',
        localidade: selected.city || '',
        uf: selected.state_province || selected.state || '',
        cep: formattedCep,
      });
      setCep(formattedCep);
      if (extractedNum) setNum(extractedNum);
      setAddressLoaded(true);

      if (cleanedCep.length === 8) {
        shipping.calculateLogistics(cleanedCep);
      }
    }
  }, [userAddresses, shipping]);

  useEffect(() => {
    if (currentUser?.default_address && !address && !addressLoaded && !hasUserEditedCep) {
      const def = currentUser.default_address;

      let logradouro = '';
      let bairro = '';

      // Use neighborhood field directly if available (new structured data)
      if (def.neighborhood) {
        bairro = def.neighborhood;
        logradouro = def.street_address || def.line1 || '';

        // Extract number from logradouro if present
        if (logradouro) {
          const commaIndex = logradouro.lastIndexOf(',');
          if (commaIndex > 0) {
            const numPart = logradouro.substring(commaIndex + 1).trim();
            if (numPart && !isNaN(Number(numPart.replace(/\D/g, '')))) {
              setNum(numPart.replace(/\D/g, ''));
              logradouro = logradouro.substring(0, commaIndex).trim();
            }
          }
        }
      } else if (def.street_address) {
        // Legacy: parse bairro from street_address (format: "Rua X, Num - Bairro")
        const streetAddr = def.street_address;
        const parts = streetAddr.split(' - ');

        if (parts.length > 0) {
          const firstPart = parts[0];
          const commaIndex = firstPart.lastIndexOf(',');
          if (commaIndex > 0) {
            logradouro = firstPart.substring(0, commaIndex).trim();
            const numPart = firstPart.substring(commaIndex + 1).trim();
            if (numPart && !isNaN(Number(numPart.replace(/\D/g, '')))) {
              setNum(numPart.replace(/\D/g, ''));
            }
          } else {
            logradouro = firstPart.trim();
          }
        }

        if (parts.length > 1) {
          bairro = parts[1].trim();
        }
      } else if (def.line1) {
        logradouro = def.line1.trim();
        bairro = def.line2?.trim() || '';
      }

      if (!logradouro || logradouro.trim() === '') {
        logradouro = def.line1?.trim() || def.street_address?.split(',')[0]?.trim() || '';
      }

      const cepValue = def.postal_code || '';
      const cleanedCep = cepValue ? cepValue.replace(/\D/g, '') : '';
      const formattedCep = cleanedCep.length === 8 ? cleanedCep.substring(0, 5) + '-' + cleanedCep.substring(5, 8) : cepValue;

      const newAddress: AddressData = {
        logradouro: logradouro,
        bairro: bairro,
        localidade: def.city || '',
        uf: def.state_province || def.state || '',
        cep: formattedCep || '',
      };

      setAddress(newAddress);
      setAddressLoaded(true);

      // Also set selectedAddressId if this is the default address
      if (def.id) {
        setSelectedAddressId(def.id);
      }

      if (cleanedCep && cleanedCep.length === 8) {
        setCep(formattedCep);
        setTimeout(() => {
          shipping.calculateLogistics(cleanedCep);
        }, 100);
      }
    }
  }, [address, addressLoaded, currentUser?.default_address, hasUserEditedCep, shipping, userMode]);

  const fetchCoordinates = async (query: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=1`
      );
      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].center;
      }
    } catch {
      return null;
    }
    return null;
  };

  useEffect(() => {
    const checkMapbox = () => {
      const win = window as any;
      if (win.mapboxgl) {
        setMapboxLoaded(true);
        win.mapboxgl.accessToken = MAPBOX_TOKEN;
        return true;
      }
      return false;
    };

    if (checkMapbox()) return;

    const interval = setInterval(() => {
      if (checkMapbox()) {
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!checkMapbox()) {
        setMapError(true);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const shouldShowMiniMap = !!(mapboxLoaded && isManualAddress && address?.cep && mapContainerRef.current && !mapError);
    if (!shouldShowMiniMap) {
      return;
    }

    let isMounted = true;
    const initializeMap = async () => {
      const mapboxgl = (window as any).mapboxgl;
      if (!mapboxgl) {
        setMapError(true);
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      if (!mapRef.current) {
        try {
          mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current!,
            style: getMapboxStyle(),
            center: [-46.6333, -23.5505],
            zoom: 13,
            attributionControl: false,
            trackResize: false,
          });

          mapRef.current.on('error', () => setMapError(true));
        } catch {
          setMapError(true);
          return;
        }
      }

      const fullAddress = `${address.logradouro}, ${address.bairro || ''}, ${address.localidade} - ${address.uf}`;

      const coords = await fetchCoordinates(fullAddress);
      if (!isMounted) return;

      if (mapRef.current && coords) {
        try {
          mapRef.current.resize();
          mapRef.current.flyTo({ center: coords, zoom: 15, speed: 1.5, essential: true });
          if (!markerRef.current) {
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.innerHTML = '<div class="marker-pin"></div><div class="marker-pulse"></div>';
            markerRef.current = new mapboxgl.Marker(el).setLngLat(coords).addTo(mapRef.current);
          } else {
            markerRef.current.setLngLat(coords);
          }
        } catch {
          return;
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          return;
        }
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [address, isManualAddress, mapError, mapboxLoaded]);

  const updatePickerMarker = useCallback(
    (coords: [number, number]) => {
      const win = window as unknown as { mapboxgl?: any };
      if (!pickerMapRef.current || !win.mapboxgl || !mapboxLoaded) return;

      try {
        if (!pickerMarkerRef.current) {
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.innerHTML = '<div class="marker-pin"></div><div class="marker-pulse"></div>';
          pickerMarkerRef.current = new win.mapboxgl.Marker(el).setLngLat(coords).addTo(pickerMapRef.current);
        } else {
          pickerMarkerRef.current.setLngLat(coords);
        }
        pickerMapRef.current.flyTo({ center: coords, zoom: 15, essential: true });
      } catch {
        return;
      }
    },
    [mapboxLoaded]
  );

  useEffect(() => {
    if (!mapboxLoaded || !isMapPickerOpen || !pickerContainerRef.current) {
      return;
    }

    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
      if (pickerMapRef.current) {
        pickerMapRef.current.remove();
        pickerMapRef.current = null;
      }

      const picker = new mapboxgl.Map({
        container: pickerContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-46.6333, -23.5505],
        zoom: 11,
        attributionControl: false,
        trackResize: false,
      });

      pickerMapRef.current = picker;

      picker.on('load', () => {
        setTimeout(() => {
          try {
            if (pickerMapRef.current) pickerMapRef.current.resize();
          } catch {
            return;
          }
        }, 500);
      });

      const handleMapClick = async (e: { lngLat: { lng: number; lat: number } }) => {
        const { lng, lat } = e.lngLat;
        updatePickerMarker([lng, lat]);
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=br`
          );
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            await parseAndSetAddress(data.features[0]);
          }
        } catch {
          return;
        }
      };

      picker.on('click', handleMapClick);
    } catch {
      return;
    }

    return () => {
      if (pickerMapRef.current) {
        try {
          pickerMapRef.current.remove();
        } catch {
          return;
        }
        pickerMapRef.current = null;
        pickerMarkerRef.current = null;
      }
    };
  }, [isMapPickerOpen, mapboxLoaded, updatePickerMarker]);

  const handlePickerSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=5&types=address,place,locality,neighborhood`
      );
      const data = await res.json();
      setSearchResults(data.features || []);
    } catch {
      return;
    } finally {
      setIsSearching(false);
    }
  };

  // Função para auto-busca com debounce no modal de endereço
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);

    // Limpa debounce anterior
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    // Limpa resultados se query muito curta
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    // Debounce de 400ms para buscar
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=5&types=address,place,locality,neighborhood`
        );
        const data = await res.json();
        setSearchResults(data.features || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const parseAndSetAddress = async (feature: MapboxFeature) => {
    const context = feature.context || [];
    const neighborhood =
      context.find((c) => c.id.startsWith('neighborhood'))?.text || context.find((c) => c.id.startsWith('locality'))?.text || '';
    const city = context.find((c) => c.id.startsWith('place'))?.text || feature.place_name?.split(',')[1]?.trim() || '';
    const state = context.find((c) => c.id.startsWith('region'))?.short_code?.replace('BR-', '') || '';
    let postcode = context.find((c) => c.id.startsWith('postcode'))?.text || '';
    const street = feature.text || feature.place_name?.split(',')[0] || '';

    if (!postcode && street && city && state) {
      try {
        const searchUrl = `https://viacep.com.br/ws/${state}/${city}/${encodeURIComponent(street)}/json/`;
        const res = await fetch(searchUrl);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0 && !data[0].erro) {
          postcode = data[0].cep || '';
          // Garantir que bairro nunca seja vazio (backend exige min 1 char)
          const finalNeighborhood = neighborhood || data[0].bairro || 'Centro';

          setManualAddress({
            street,
            neighborhood: finalNeighborhood,
            city,
            state,
            cep: postcode ? postcode.replace(/(\d{5})(\d{3})/, '$1-$2') : '',
          });
          return;
        }
      } catch {
        // Se falhar a busca, ainda define o endereço com fallback para bairro
      }
    }

    // Garantir que bairro nunca seja vazio (backend exige min 1 char)
    const finalNeighborhood = neighborhood || 'Centro';

    setManualAddress({
      street,
      neighborhood: finalNeighborhood,
      city,
      state,
      cep: postcode ? postcode.replace(/(\d{5})(\d{3})/, '$1-$2') : '',
    });
  };

  const handleSelectSearchResult = async (result: MapboxFeature) => {
    await parseAndSetAddress(result);
    setSearchResults([]);
    setSearchQuery('');
    if (result.center) updatePickerMarker(result.center);
  };

  const confirmManualAddress = async () => {
    setHasUserEditedCep(true);
    setManualCepError(null);

    const finalCep = normalizeCepDigits(manualAddress.cep || '');
    if (finalCep.length > 0 && finalCep.length !== 8) {
      setManualCepError('CEP deve ter 8 dígitos');
      return;
    }

    if (finalCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${finalCep}/json/`);
        if (!res.ok) throw new Error('CEP lookup failed');
        const data = await res.json();
        if (data.erro) {
          setManualCepError('CEP inválido');
          return;
        }
      } catch {
        setManualCepError('Não foi possível validar o CEP');
        return;
      }
    }

    // Validar bairro obrigatório (backend exige min 1 char)
    if (!manualAddress.neighborhood || manualAddress.neighborhood.trim() === '') {
      setManualCepError('Bairro é obrigatório');
      return;
    }

    const formattedCep = finalCep ? maskCep(finalCep) : '';

    setAddress({
      logradouro: manualAddress.street,
      bairro: manualAddress.neighborhood,
      localidade: manualAddress.city,
      uf: manualAddress.state,
      cep: formattedCep || undefined,
    });
    setIsManualAddress(true);
    setCep(formattedCep || '');
    setIsMapPickerOpen(false);

    shipping.calculateLogistics(finalCep);
  };

  const handleCepChange = (val: string) => {
    setHasUserEditedCep(true);
    const cleaned = normalizeCepDigits(val);
    const formatted = cleaned ? maskCep(cleaned) : '';
    setCep(formatted);
    setCepError(null);

    // Limpa debounce anterior
    if (cepDebounceRef.current) {
      clearTimeout(cepDebounceRef.current);
      cepDebounceRef.current = null;
    }

    // Só limpa o endereço se CEP estiver completamente vazio E não tiver endereço selecionado
    if (cleaned.length === 0) {
      // Se tem endereço selecionado, não limpa - apenas resetar CEP
      if (!selectedAddressId && !address) {
        setAddress(null);
        setIsManualAddress(false);
        shipping.resetShipping();
      }
      return;
    }

    // NÃO apagar o endereço existente enquanto usuário digita
    // Apenas retorna sem fazer nada - aguarda CEP completo
    if (cleaned.length < 8) {
      // Não limpa o endereço existente - usuário pode estar editando o CEP
      return;
    }

    // CEP completo: debounce de 500ms antes de buscar
    if (cleaned.length === 8) {
      setLoadingCep(true);
      cepDebounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
          if (!res.ok) throw new Error('CEP lookup failed');
          const data = await res.json();
          if (data.erro) throw new Error('CEP not found');
          // Se bairro estiver vazio, deixa vazio para o usuário preencher
          setAddress({
            ...data,
            bairro: data.bairro?.trim() || ''
          });
          setIsManualAddress(false);
          shipping.calculateLogistics(cleaned);
        } catch {
          try {
            const resFallback = await fetch(`https://cep.awesomeapi.com.br/json/${cleaned}`);
            if (!resFallback.ok) throw new Error('Fallback failed');
            const dataFallback = await resFallback.json();
            // Se bairro estiver vazio, deixa vazio para o usuário preencher
            setAddress({
              logradouro: dataFallback.address || '',
              bairro: dataFallback.district || dataFallback.address_name || '',
              localidade: dataFallback.city || '',
              uf: dataFallback.state || '',
            });
            setIsManualAddress(false);
            shipping.calculateLogistics(cleaned);
          } catch {
            setCepError('Falha ao carregar CEP. Use o buscador de mapa.');
            setAddress(null);
          }
        } finally {
          setLoadingCep(false);
        }
      }, 500);
    }
  };

  const payment = usePaymentProcessing({
    items,
    currentUser,
    storeConfig,
    userMode,
    address,
    num,
    complement,
    phone,
    paymentMethod,
    finalTotal,
    saveCardForFuture,
    selectedSavedCardId,
    bestInternalShipping: shipping.bestInternalShipping,
    selectedShippingOption: shipping.selectedShippingOption,
    onComplete,
    pixData,
    boletoData,
  });

  return {
    currentUser,
    userMode,
    locale,
    step,
    setStep,
    cep,
    setCep,
    address,
    setAddress,
    loadingCep,
    mapError,
    mapboxLoaded,
    num,
    setNum,
    complement,
    setComplement,
    phone,
    setPhone,
    cpf,
    setCpf,
    cepError,
    manualCepError,
    isMapPickerOpen,
    setIsMapPickerOpen,
    addressLoaded,
    setAddressLoaded,
    isManualAddress,
    setIsManualAddress,
    paymentMethod,
    setPaymentMethod,
    splitCards,
    setSplitCards,
    payment,
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
    couponCode,
    setCouponCode,
    couponLoading,
    couponError,
    appliedCoupon,
    checkoutItems,
    itemsWithCoupon,
    itemsWithoutCoupon,
    subtotal,
    originalSubtotal,
    preAppliedDiscount,
    manualCouponDiscount,
    shippingCost,
    shipping,
    availableCashback,
    pixDiscount,
    cashbackUsed,
    finalTotal,
    finalTotalWithFees,
    // Installment states
    installmentOptions,
    selectedInstallments,
    selectedInstallmentCode,
    selectedInstallmentOption,
    installmentsLoading,
    handleSelectInstallments,
    // Split card states
    card1Amount,
    card2Amount,
    card1Installments,
    card1InstallmentCode,
    card1Options,
    card2Installments,
    card2InstallmentCode,
    card2Options,
    splitCardsValid,
    handleCard1AmountChange,
    handleCard2AmountChange,
    handleSelectCard1Installments,
    handleSelectCard2Installments,
    handleApplyCoupon,
    handleRemoveCoupon,
    // PIX/Boleto states and functions
    pixData,
    pixLoading,
    pixError,
    boletoData,
    boletoLoading,
    boletoError,
    paymentProcessing,
    setPaymentProcessing,
    createPixCharge,
    createBoletoCharge,
    resetPaymentData,
    completeOrderWithPayment,
    getLoc,
    mapContainerRef,
    pickerContainerRef,
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    handlePickerSearch,
    handleSearchQueryChange,
    handleSelectSearchResult,
    manualAddress,
    setManualAddress,
    confirmManualAddress,
    handleCepChange,
    maskPhone,
    maskCPF,
    unmask,
    // Saved addresses
    userAddresses,
    selectedAddressId,
    loadingAddresses,
    handleSelectSavedAddress,
  };
}

export type CheckoutState = ReturnType<typeof useCheckoutState>;
