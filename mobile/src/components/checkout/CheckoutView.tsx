/**
 * CheckoutView Component - React Native
 * Adapted from web version
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck, CreditCard, MapPin } from '../ui/Icons';
import { CartItem, InternalLogisticsInfo, UserProfile, StoreConfig, UserMode } from '../../types';
import { Locale } from '../../i18n';
import { LogisticsService, ShippingOption } from '../../services/logistics.service';
import { AddressForm, AddressData } from './AddressForm';
import { PaymentForm, CardData } from './PaymentForm';
import { OrderSummary } from './OrderSummary';
import { MapPicker } from './MapPicker';

interface CheckoutViewProps {
  items: CartItem[];
  currentUser: UserProfile | null;
  storeConfig?: StoreConfig;
  userMode: UserMode;
  onBack: () => void;
  onComplete: (
    address: AddressData,
    logistics: InternalLogisticsInfo,
    paymentMethod: 'credit_card' | 'pix',
    finalAmount: number,
    saveCard: boolean,
    cardToken?: string,
    cardData?: CardData
  ) => void;
  locale: Locale;
  t: (key: string) => any;
}

type PaymentMethod = 'credit_card' | 'pix';

const CheckoutView: React.FC<CheckoutViewProps> = ({
  items,
  currentUser,
  storeConfig,
  userMode,
  onBack,
  onComplete,
  locale,
  t
}) => {
  const insets = useSafeAreaInsets();
  const logisticsService = new LogisticsService();
  const [step, setStep] = useState(1);
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState<AddressData | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingDisplay, setShippingDisplay] = useState<{ price: number; days: number } | null>(null);
  const [bestInternalShipping, setBestInternalShipping] = useState<InternalLogisticsInfo | null>(null);
  // Multiple shipping options for atacado mode
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [num, setNum] = useState('');
  const [complement, setComplement] = useState('');
  const [cepError, setCepError] = useState<string | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | null>(null);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);

  const getLoc = (obj: any): string => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // In atacado mode, add shipping cost to total
  const shippingCost = userMode === UserMode.ATACADO && selectedShippingOption 
    ? selectedShippingOption.display_price_was 
    : 0;
  const total = subtotal + shippingCost;
  const finalTotal = paymentMethod === 'pix' ? total * 0.95 : total;

  // Calculate logistics when CEP changes
  const calculateLogistics = useCallback(async (cepValue: string, addressData?: AddressData) => {
    const cleaned = cepValue.replace(/\D/g, '');
    if (!cleaned || cleaned.length !== 8) return;
    
    setCalculatingShipping(true);
    setShippingOptions([]);
    setSelectedShippingOption(null);
    
    try {
      if (userMode === UserMode.ATACADO) {
        // Get multiple options for atacado mode
        const options = await logisticsService.calculateShippingOptions(cleaned, addressData);
        setShippingOptions(options);
        
        // Select cheapest by default
        const cheapest = options.reduce((prev, curr) => 
          curr.real_cost < prev.real_cost ? curr : prev
        );
        setSelectedShippingOption(cheapest);
        
        setShippingDisplay({
          price: cheapest.display_price_was,
          days: cheapest.display_days_was
        });
        
        setBestInternalShipping({
          selected_carrier: cheapest.provider,
          method: cheapest.method,
          real_cost: cheapest.real_cost,
          estimated_days: cheapest.estimated_days,
          display_price_was: cheapest.display_price_was,
          display_days_was: cheapest.display_days_was,
        });
      } else {
        // Single option for varejo mode (free shipping)
        const result = await logisticsService.calculateShipping(cleaned, addressData);
        if (result) {
          setBestInternalShipping(result);
          setShippingDisplay({
            price: result.real_cost || 0,
            days: result.estimated_days || 5
          });
        }
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
    } finally {
      setCalculatingShipping(false);
    }
  }, [logisticsService, userMode]);

  // Auto-fill default address
  useEffect(() => {
    if (currentUser?.default_address && !address) {
      const def = currentUser.default_address;
      // Parse street_address to extract logradouro and bairro
      const streetParts = (def.street_address || '').split(' - ');
      const logradouro = streetParts[0] || '';
      const bairro = streetParts[1] || streetParts[2] || '';
      
      setAddress({
        logradouro: logradouro,
        bairro: bairro,
        localidade: def.city || '',
        uf: def.state_province || '',
        cep: def.postal_code || ''
      });
      setCep(def.postal_code || '');
      const defaultAddress: AddressData = {
        logradouro: logradouro,
        bairro: bairro,
        localidade: def.city || '',
        uf: def.state_province || '',
        cep: def.postal_code || ''
      };
      if (def.postal_code) {
        calculateLogistics(def.postal_code.replace(/\D/g, ''), defaultAddress);
      }
    }
  }, [currentUser, calculateLogistics]);

  const handleCepChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setCep(value); // Keep formatted value for display
    setCepError(null);

    if (cleaned.length === 8) {
      // Fetch CEP data
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await res.json();
        if (data.erro) {
          setCepError('CEP não encontrado');
          setAddress(null);
        } else {
          const newAddress: AddressData = {
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            localidade: data.localidade || '',
            uf: data.uf || '',
            cep: cleaned
          };
          setAddress(newAddress);
          // Calculate logistics after address is set
          await calculateLogistics(cleaned, newAddress);
        }
      } catch (error) {
        setCepError('Erro ao buscar CEP');
      } finally {
        setLoadingCep(false);
      }
    } else {
      setAddress(null);
    }
  };

  const handleCompleteOrder = () => {
    // Validate minimum quantity for atacado mode
    if (userMode === UserMode.ATACADO) {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < 10) {
        Alert.alert('Quantidade Mínima', `Mínimo de 10 peças necessário no modo Atacado. Você tem ${totalQuantity} peça(s) no carrinho.`);
        return;
      }
    }

    // Use selected shipping option for atacado, or bestInternalShipping for varejo
    const shippingToUse = userMode === UserMode.ATACADO && selectedShippingOption
      ? {
          selected_carrier: selectedShippingOption.provider,
          method: selectedShippingOption.method,
          real_cost: selectedShippingOption.real_cost,
          estimated_days: selectedShippingOption.estimated_days,
          display_price_was: selectedShippingOption.display_price_was,
          display_days_was: selectedShippingOption.display_days_was
        }
      : bestInternalShipping;

    if (!address || !num || !shippingToUse) return;

    const finalAddress: AddressData = {
      ...address,
      numero: num,
      complemento: complement,
      cep: cep
    };

    onComplete(
      finalAddress,
      shippingToUse,
      paymentMethod,
      finalTotal,
      saveCardForFuture,
      selectedSavedCardId || undefined,
      cardData || undefined
    );
  };

  const steps = [
    { id: 1, title: 'Endereço', icon: MapPin },
    { id: 2, title: 'Pagamento', icon: CreditCard },
    { id: 3, title: 'Revisão', icon: ShieldCheck }
  ];

  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth >= 1024; // lg breakpoint

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}
    >
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={16} color="#737373" />
          </TouchableOpacity>
          <Text style={styles.title}>Finalizar Pedido</Text>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((s, idx) => (
            <View key={s.id} style={styles.stepItem}>
              <View style={[styles.stepIcon, step >= s.id && styles.stepIconActive]}>
                <s.icon size={16} color={step >= s.id ? '#FFFFFF' : '#A3A3A3'} />
              </View>
              {isLargeScreen ? (
                <>
                  <Text style={[styles.stepText, step >= s.id && styles.stepTextActive]}>
                    {s.title}
                  </Text>
                  {idx < steps.length - 1 && <View style={styles.stepSeparator} />}
                </>
              ) : (
                idx < steps.length - 1 && <View style={styles.stepLine} />
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.mainContent, isLargeScreen && styles.mainContentRow]}>
        <View style={[styles.formSection, isLargeScreen && styles.formSectionLarge]}>
          {step === 1 && (
            <AddressForm
              cep={cep}
              address={address}
              num={num}
              complement={complement}
              cepError={cepError}
              loadingCep={loadingCep}
              calculatingShipping={calculatingShipping}
              shippingDisplay={shippingDisplay}
              bestInternalShipping={bestInternalShipping}
              currentUser={currentUser}
              locale={locale}
              onCepChange={handleCepChange}
              onNumChange={setNum}
              onComplementChange={setComplement}
              onOpenMapPicker={() => setIsMapPickerOpen(true)}
              onNext={() => {
                if (address && num && bestInternalShipping) {
                  setStep(2);
                }
              }}
              mapError={false}
              mapboxLoaded={false}
            />
          )}

          {step === 2 && (
            <PaymentForm
              paymentMethod={paymentMethod}
              currentUser={currentUser}
              storeConfig={storeConfig}
              selectedSavedCardId={selectedSavedCardId}
              saveCardForFuture={saveCardForFuture}
              pixCopied={pixCopied}
              locale={locale}
              onPaymentMethodChange={setPaymentMethod}
              onSavedCardSelect={setSelectedSavedCardId}
              onSaveCardToggle={setSaveCardForFuture}
              onCopyPix={() => setPixCopied(true)}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              onCardDataChange={setCardData}
            />
          )}

          {step === 3 && (
            <View style={styles.reviewSection}>
              <View style={styles.reviewIconContainer}>
                <ShieldCheck size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.reviewTitle}>Finalização Segura</Text>
              <Text style={styles.reviewText}>
                Seu pedido passará por uma análise de segurança automática e será despachado em até 24h úteis.
              </Text>
              <View style={styles.reviewActions}>
                <TouchableOpacity onPress={() => setStep(2)} style={styles.reviewBackButton}>
                  <Text style={styles.reviewBackText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCompleteOrder} style={styles.reviewCompleteButton}>
                  <Text style={styles.reviewCompleteText}>CONCLUIR COMPRA</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.summarySection, isLargeScreen && styles.summarySectionLarge]}>
          <OrderSummary
            items={items}
            subtotal={subtotal}
            total={finalTotal}
            paymentMethod={paymentMethod}
            calculatingShipping={calculatingShipping}
            shippingDisplay={shippingDisplay}
            locale={locale}
            getLoc={getLoc}
            userMode={userMode}
            shippingOptions={shippingOptions}
            selectedShippingOption={selectedShippingOption}
            onSelectShippingOption={setSelectedShippingOption}
          />
        </View>
      </View>

      {/* Map Picker Modal */}
      <MapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onConfirm={(addressData, cepValue) => {
          setAddress(addressData);
          setCep(cepValue);
          setIsMapPickerOpen(false);
          if (cepValue) {
            calculateLogistics(cepValue.replace(/\D/g, ''), addressData);
          }
        }}
        onCalculateLogistics={(cepValue) => {
          if (cepValue && cepValue !== 'Manual') {
            const cleaned = cepValue.replace(/\D/g, '');
            if (cleaned.length === 8) {
              if (address) {
                calculateLogistics(cleaned, address);
              }
            }
          }
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingVertical: 96, // pt-24 equivalent
    paddingHorizontal: 24, // px-6 md:px-12
    paddingBottom: 80, // pb-20
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  headerContainer: {
    marginBottom: 80, // mb-20
    gap: 32, // gap-8
  },
  header: {
    marginBottom: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    color: '#737373',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 40, // gap-10
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // gap-4
  },
  stepText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginLeft: 8,
  },
  stepTextActive: {
    color: '#000000',
  },
  stepSeparator: {
    width: 32, // w-8
    height: 1, // h-[1px]
    backgroundColor: '#F5F5F5', // bg-neutral-100
    marginHorizontal: 16, // gap-4 / 2
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  stepLine: {
    width: 32,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  mainContent: {
    gap: 80,
  },
  mainContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  formSection: {
    flex: 1,
  },
  formSectionLarge: {
    flex: 0,
    width: '58.33%',
  },
  summarySection: {
    marginTop: 32,
  },
  summarySectionLarge: {
    flex: 0,
    width: '41.67%',
    marginTop: 0,
    marginLeft: 80,
  },
  reviewSection: {
    padding: 48,
    backgroundColor: '#FAFAFA',
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  reviewIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  reviewTitle: {
    fontSize: 28,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: -1,
    marginBottom: 16,
  },
  reviewText: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
    marginBottom: 48,
    maxWidth: 400,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 400,
  },
  reviewBackButton: {
    flex: 1,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 32,
    alignItems: 'center',
  },
  reviewBackText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
  },
  reviewCompleteButton: {
    flex: 2,
    paddingVertical: 32,
    backgroundColor: '#000000',
    borderRadius: 32,
    alignItems: 'center',
  },
  reviewCompleteText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 5,
    color: '#FFFFFF',
  },
});

export default CheckoutView;
