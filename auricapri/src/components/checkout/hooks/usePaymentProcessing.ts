import { useCallback, useMemo, useState } from 'react';
import { PaymentMethod } from '../../../constants/enums';
import { UserMode, type AddressData, type CartItem, type InternalLogisticsInfo, type StoreConfig, type UserMode as UserModeType, type UserProfile } from '../../../types';

export function usePaymentProcessing(params: {
  items: CartItem[];
  currentUser: UserProfile | null;
  storeConfig?: StoreConfig;
  userMode: UserModeType;
  address: AddressData | null;
  num: string;
  complement: string;
  phone: string;
  paymentMethod: PaymentMethod;
  finalTotal: number;
  saveCardForFuture: boolean;
  selectedSavedCardId: string | null;
  bestInternalShipping: InternalLogisticsInfo | null;
  selectedShippingOption: {
    provider: string;
    method: string;
    real_cost: number;
    estimated_days: number;
    display_price_was: number;
    display_days_was: number;
  } | null;
  onComplete: (
    address: AddressData,
    logistics: InternalLogisticsInfo,
    paymentMethod: PaymentMethod,
    finalAmount: number,
    saveCard: boolean,
    cardToken?: string,
    phone?: string
  ) => void;
}): {
  pixCopied: boolean;
  handleCopyPix: () => void;
  handleCompleteOrder: () => void;
} {
  const {
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
    bestInternalShipping,
    selectedShippingOption,
    onComplete,
  } = params;

  const [pixCopied, setPixCopied] = useState(false);

  const pixKey = useMemo(() => storeConfig?.pix_key || '', [storeConfig?.pix_key]);

  const handleCopyPix = useCallback(() => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  }, [pixKey]);

  const handleCompleteOrder = useCallback(() => {
    if (userMode === UserMode.ATACADO) {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < 10) {
        alert(`Mínimo de 10 peças necessário no modo Atacado. Você tem ${totalQuantity} peça(s) no carrinho.`);
        return;
      }
    }

    const shippingToUse: InternalLogisticsInfo | null =
      userMode === UserMode.ATACADO && selectedShippingOption
        ? {
            selected_carrier: selectedShippingOption.provider,
            method: selectedShippingOption.method,
            real_cost: selectedShippingOption.real_cost,
            estimated_days: selectedShippingOption.estimated_days,
            display_price_was: selectedShippingOption.display_price_was,
            display_days_was: selectedShippingOption.display_days_was,
          }
        : bestInternalShipping;

    if (!address || !shippingToUse) return;

    const finalAddress = { ...address, numero: num, complemento: complement };

    let tokenToUse: string | undefined;
    if (paymentMethod === PaymentMethod.CREDIT_CARD && selectedSavedCardId) {
      const saved = currentUser?.saved_cards?.find((c) => c.id === selectedSavedCardId);
      tokenToUse = saved?.gateway_token;
    }

    const phoneToSave = phone || currentUser?.phone || '';
    onComplete(finalAddress, shippingToUse, paymentMethod, finalTotal, saveCardForFuture, tokenToUse, phoneToSave);
  }, [
    address,
    bestInternalShipping,
    complement,
    currentUser,
    finalTotal,
    items,
    num,
    onComplete,
    paymentMethod,
    phone,
    saveCardForFuture,
    selectedSavedCardId,
    selectedShippingOption,
    userMode,
  ]);

  return { pixCopied, handleCopyPix, handleCompleteOrder };
}
