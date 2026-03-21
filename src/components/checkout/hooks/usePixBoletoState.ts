/**
 * usePixBoletoState - Manages PIX QR code generation and Boleto creation
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OrderStatus, PaymentMethod } from '../../../constants/enums';
import { PaymentsApi } from '../../../api/payments.api';
import { OrdersApi } from '../../../api/orders.api';
import { UsersApi } from '../../../api/users.api';
import { UserMode } from '../../../types';
import type {
  CardData,
  CustomerPaymentInfo,
  PixData,
  BoletoData,
  UsePixBoletoStateParams,
  UsePixBoletoStateReturn,
} from './types';

export function usePixBoletoState(params: UsePixBoletoStateParams): UsePixBoletoStateReturn {
  const {
    currentUser,
    address,
    phone,
    cpf,
    num,
    complement,
    items,
    subtotal,
    finalTotal,
    cashbackUsed,
    shipping,
    userMode,
    paymentMethod,
    onComplete,
    saveCardForFuture,
    step,
    setStep,
    onPixPaymentConfirmed,
    cardData,
    cardToken,
    selectedInstallments,
    selectedInstallmentCode,
  } = params;

  const paymentsApi = useMemo(() => new PaymentsApi(), []);
  const ordersApi = useMemo(() => new OrdersApi(), []);
  const usersApi = useMemo(() => new UsersApi(), []);

  // PIX state
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);

  // Boleto state
  const [boletoData, setBoletoData] = useState<BoletoData | null>(null);
  const [boletoLoading, setBoletoLoading] = useState(false);
  const [boletoError, setBoletoError] = useState<string | null>(null);

  // Credit card error state
  const [creditCardError, setCreditCardError] = useState<string | null>(null);

  // General payment processing state
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Polling: track order waiting for PIX confirmation
  const [pendingPixOrderId, setPendingPixOrderId] = useState<string | null>(null);
  // Stable ref to completion args so polling closure always has latest values
  const pixCompletionArgsRef = useRef<Parameters<typeof onComplete> | null>(null);
  // Stable ref to onComplete so effect doesn't restart interval on every render
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  // Stable ref to the post-confirmation callback (clears cart + navigates home)
  const onPixPaymentConfirmedRef = useRef(onPixPaymentConfirmed);
  onPixPaymentConfirmedRef.current = onPixPaymentConfirmed;

  // Create PIX charge - returns true if successful, false otherwise
  const createPixCharge = useCallback(async (orderId: string, customerInfo: CustomerPaymentInfo): Promise<boolean> => {
    setPixLoading(true);
    setPixError(null);
    try {
      const response = await paymentsApi.processPayment({
        orderId,
        method: 'pix',
        customerInfo
      });

      if (response.qrCodeImage && response.qrCodePayload && response.expiresAt) {
        // Robust date parsing - handles different formats
        let expiresAtDate: Date;
        const expiresAtValue = response.expiresAt as string | number | Date;

        if (typeof expiresAtValue === 'string') {
          // If ISO string, convert directly
          expiresAtDate = new Date(expiresAtValue);
        } else if (typeof expiresAtValue === 'number') {
          // If timestamp in ms or seconds
          expiresAtDate = expiresAtValue > 10000000000
            ? new Date(expiresAtValue)  // Already in ms
            : new Date(expiresAtValue * 1000); // In seconds, convert to ms
        } else if (expiresAtValue instanceof Date) {
          expiresAtDate = expiresAtValue;
        } else {
          // Fallback: 10 minutes from now
          // unrecognized format fallback
          expiresAtDate = new Date(Date.now() + 10 * 60 * 1000);
        }

        // Validate if date is valid and in the future
        if (isNaN(expiresAtDate.getTime())) {
          // invalid date fallback
          expiresAtDate = new Date(Date.now() + 10 * 60 * 1000);
        }

        setPixData({
          qrCodeImage: response.qrCodeImage,
          qrCodePayload: response.qrCodePayload,
          expiresAt: expiresAtDate,
          paymentId: response.paymentId
        });
        return true;
      } else {
        // PIX response incomplete
        setPixError('QR Code não foi gerado corretamente. Tente novamente.');
        return false;
      }
    } catch (error) {
      // PIX charge error handled below
      const errorMsg = error instanceof Error ? error.message : 'Erro ao gerar PIX';
      setPixError(errorMsg);
      return false;
    } finally {
      setPixLoading(false);
    }
  }, [paymentsApi]);

  // Create Boleto charge
  const createBoletoCharge = useCallback(async (orderId: string, customerInfo: CustomerPaymentInfo) => {
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
    setCreditCardError(null);
    setPendingPixOrderId(null);
    pixCompletionArgsRef.current = null;
  }, []);

  // Poll order status after PIX is generated — calls onComplete when CONFIRMED.
  // Primary poll uses exponential backoff (2s → 4s → ... capped at 10s).
  // Fallback poll queries Asaas directly every 30s as self-heal when webhook fails.
  useEffect(() => {
    if (!pendingPixOrderId) return;

    const FALLBACK_INTERVAL_MS = 30000;
    const MAX_POLLS = 120; // ~10 minutes at avg 5s interval
    let count = 0;
    let cancelled = false;

    const handleConfirmed = () => {
      if (cancelled) return;
      setPendingPixOrderId(null);
      if (onPixPaymentConfirmedRef.current) {
        pixCompletionArgsRef.current = null;
        onPixPaymentConfirmedRef.current();
      } else {
        const args = pixCompletionArgsRef.current;
        pixCompletionArgsRef.current = null;
        if (args) onCompleteRef.current(...args);
      }
    };

    // Fallback poll declared first so primary timer callback can reference it safely
    const fallbackTimer = setInterval(async () => {
      if (cancelled) return;
      try {
        const { apiClient } = await import('../../../api/client');
        const result = await apiClient.get<{ orderStatus: string; confirmed: boolean }>(
          `/payments/pix-verify/${pendingPixOrderId}`
        );
        if (result.confirmed) {
          clearInterval(primaryTimer);
          clearInterval(fallbackTimer);
          handleConfirmed();
        }
      } catch {
        // Ignore — webhook path may still deliver
      }
    }, FALLBACK_INTERVAL_MS);

    // Primary poll: gentle backoff starting at 2s, capped at 5s
    // Growth factor 1.2x: 2s → 2.4s → 2.9s → 3.5s → 4.2s → 5s (cap)
    // ~60% fewer requests than fixed 1s while still feeling near-instant to the user
    let currentInterval = 2000;
    let primaryTimer: ReturnType<typeof setTimeout>;

    const schedulePoll = () => {
      primaryTimer = setTimeout(async () => {
        if (cancelled) return;
        count++;
        if (count > MAX_POLLS) {
          clearInterval(fallbackTimer);
          if (!cancelled) setPendingPixOrderId(null);
          return;
        }
        try {
          const order = await ordersApi.getById(pendingPixOrderId);
          if (order?.status === OrderStatus.CONFIRMED) {
            clearInterval(fallbackTimer);
            handleConfirmed();
            return;
          }
        } catch {
          // Ignore transient errors — will retry on next tick
        }
        if (!cancelled) {
          currentInterval = Math.min(currentInterval * 1.2, 5000);
          schedulePoll();
        }
      }, currentInterval);
    };

    schedulePoll();

    return () => {
      cancelled = true;
      clearTimeout(primaryTimer);
      clearInterval(fallbackTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPixOrderId, ordersApi]);

  // Complete order flow: create order then process payment
  const completeOrderWithPayment = useCallback(async (overridePaymentMethod?: PaymentMethod) => {
    if (!address || !phone) {
      throw new Error('Endereço e telefone são obrigatórios');
    }

    // Check if user is still authenticated before creating order
    const { supabase } = await import('../../../utils/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Sua sessão expirou. Por favor, faça login novamente para continuar.');
    }

    // Use override payment method if provided (fixes race condition when setting state and calling immediately)
    const effectivePaymentMethod = overridePaymentMethod ?? paymentMethod;

    // Validate CPF - cpf do checkout tem prioridade sobre o do perfil
    const cpfValue = cpf || currentUser?.cpf || '';
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

      // Familia coupon: armazenado em sessionStorage quando ativo
      const familiaCouponCode = sessionStorage.getItem('familia_coupon_code') || undefined;

      // 1. Create order first
      const order = await ordersApi.create({
        items: items,
        addressData: finalAddress,
        logisticsInfo: shippingToUse,
        paymentMethod: effectivePaymentMethod,
        subtotal: subtotal,
        finalAmount: finalTotal,
        cashbackUsed: cashbackUsed > 0 ? cashbackUsed : undefined,
        couponCode: familiaCouponCode,
      });

      // Salva CPF no perfil se foi alterado ou ainda não estava salvo
      const cpfToUse = cpf || currentUser?.cpf || '';
      const cleanCpfNew = cpf.replace(/\D/g, '');
      const cleanCpfProfile = (currentUser?.cpf || '').replace(/\D/g, '');
      if (cpf && cleanCpfNew !== cleanCpfProfile) {
        try {
          await usersApi.updateProfile({ cpf: cleanCpfNew });
        } catch {
          // Silent - não bloqueia o checkout se falhar
        }
      }

      // 2. Build customer info for payment
      // Email: profile tem prioridade, mas session.user.email é fallback garantido
      const email = currentUser?.email || session.user.email || '';
      const customerInfo: CustomerPaymentInfo = {
        name: currentUser?.full_name || session.user.user_metadata?.full_name || '',
        email,
        cpfCnpj: cpfToUse.replace(/\D/g, ''),
        phone: phone.replace(/\D/g, ''),
        postalCode: address.cep?.replace(/\D/g, '') || '',
        addressNumber: num,
        addressComplement: complement || undefined,
      };

      // If total is 0 (100% coupon + free shipping), skip payment creation entirely.
      // Use onPixPaymentConfirmed if available to avoid calling onComplete (= handlePlaceOrder),
      // which would create a second order — the order was already created above.
      if (finalTotal <= 0) {
        if (onPixPaymentConfirmedRef.current) {
          onPixPaymentConfirmedRef.current();
        } else {
          onComplete(finalAddress, shippingToUse, effectivePaymentMethod, 0, saveCardForFuture, undefined, phone, cashbackUsed);
        }
        return order;
      }

      // 3. Process payment based on method
      if (effectivePaymentMethod === PaymentMethod.PIX) {
        const pixSuccess = await createPixCharge(order.id, customerInfo);
        // Go back to payment step to show QR code only if PIX was created successfully
        // and we're not already on step 2 (auto-generation case)
        if (pixSuccess && step !== 2) {
          setStep(2);
        }
        if (pixSuccess) {
          // Store args so the polling effect can call onComplete when order is CONFIRMED
          pixCompletionArgsRef.current = [finalAddress, shippingToUse, effectivePaymentMethod, finalTotal, saveCardForFuture, undefined, phone, cashbackUsed];
          setPendingPixOrderId(order.id);
        }
        // If failed, user stays on current step to see the error
      } else if (effectivePaymentMethod === PaymentMethod.BOLETO) {
        await createBoletoCharge(order.id, customerInfo);
        // Go back to payment step to show boleto (only if not already there)
        if (step !== 2) {
          setStep(2);
        }
      } else if (effectivePaymentMethod === PaymentMethod.CREDIT_CARD) {
        // Validate: we need either card data or a saved card token
        if (!cardData && !cardToken) {
          const errorMsg = 'Dados do cartão são obrigatórios';
          setCreditCardError(errorMsg);
          throw new Error(errorMsg);
        }

        const creditCardResult = await paymentsApi.processPayment({
          orderId: order.id,
          method: 'credit_card',
          installments: selectedInstallments || 1,
          installmentCode: selectedInstallmentCode,
          card: cardData ? {
            holderName: cardData.holderName,
            number: cardData.number.replace(/\s/g, ''),
            expiryMonth: cardData.expiryMonth,
            expiryYear: cardData.expiryYear,
            cvv: cardData.cvv,
          } : undefined,
          cardToken: cardToken || undefined,
          saveCard: saveCardForFuture,
          customerInfo,
        });

        if (creditCardResult.success) {
          // Success: clear cart and show success overlay (same as PIX confirmation)
          if (onPixPaymentConfirmedRef.current) {
            onPixPaymentConfirmedRef.current();
          } else {
            onCompleteRef.current(finalAddress, shippingToUse, effectivePaymentMethod, finalTotal, saveCardForFuture, creditCardResult.paymentId, phone, cashbackUsed);
          }
        } else {
          const errorMsg = 'Pagamento recusado. Verifique os dados do cartão.';
          setCreditCardError(errorMsg);
          throw new Error(errorMsg);
        }
      }

      return order;
    } catch (error) {
      // Order error handled below
      const errorMsg = error instanceof Error ? error.message : 'Erro ao processar pedido';
      if (effectivePaymentMethod === PaymentMethod.PIX) {
        setPixError(errorMsg);
      } else if (effectivePaymentMethod === PaymentMethod.BOLETO) {
        setBoletoError(errorMsg);
      } else if (effectivePaymentMethod === PaymentMethod.CREDIT_CARD) {
        setCreditCardError(errorMsg);
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
    cashbackUsed,
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
    setStep,
    setPendingPixOrderId,
    cardData,
    cardToken,
    selectedInstallments,
    selectedInstallmentCode,
  ]);

  return {
    // PIX state
    pixData,
    pixLoading,
    pixError,
    createPixCharge,

    // Boleto state
    boletoData,
    boletoLoading,
    boletoError,
    createBoletoCharge,

    // Credit card error
    creditCardError,

    // General
    paymentProcessing,
    setPaymentProcessing,
    resetPaymentData,
    completeOrderWithPayment,
  };
}
