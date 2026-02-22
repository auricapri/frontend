/**
 * usePixBoletoState - Manages PIX QR code generation and Boleto creation
 */

import { useCallback, useMemo, useState } from 'react';
import { PaymentMethod } from '../../../constants/enums';
import { PaymentsApi } from '../../../api/payments.api';
import { OrdersApi } from '../../../api/orders.api';
import { UsersApi } from '../../../api/users.api';
import { UserMode } from '../../../types';
import type {
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
    shipping,
    userMode,
    paymentMethod,
    onComplete,
    saveCardForFuture,
    step,
    setStep,
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

  // General payment processing state
  const [paymentProcessing, setPaymentProcessing] = useState(false);

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
  }, []);

  // Complete order flow: create order then process payment
  const completeOrderWithPayment = useCallback(async (overridePaymentMethod?: PaymentMethod) => {
    if (!address || !phone) {
      throw new Error('Endereço e telefone são obrigatórios');
    }

    // Check if user is still authenticated before creating order
    const { supabase } = await import('../../../utils/supabase');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      // Session expired
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

      // 1. Create order first
      const order = await ordersApi.create({
        items: items,
        addressData: finalAddress,
        logisticsInfo: shippingToUse,
        paymentMethod: effectivePaymentMethod,
        subtotal: subtotal,
        finalAmount: finalTotal,
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
      const customerInfo: CustomerPaymentInfo = {
        name: currentUser?.full_name || '',
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
      // Order error handled below
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
    setStep,
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

    // General
    paymentProcessing,
    setPaymentProcessing,
    resetPaymentData,
    completeOrderWithPayment,
  };
}
