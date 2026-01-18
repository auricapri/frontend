/**
 * AddressForm Component - React Native
 * Adapted from web version
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { MapPin, Search, Navigation, AlertCircle, Loader2, ChevronRight } from '../ui/Icons';
import { Locale } from '../../i18n';
import { maskCPF } from '../../utils/masks';

export interface AddressData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  cep?: string;
  numero?: string;
  complemento?: string;
  erro?: boolean;
}

interface AddressFormProps {
  cep: string;
  address: AddressData | null;
  num: string;
  complement: string;
  cpf: string;
  cepError: string | null;
  loadingCep: boolean;
  calculatingShipping: boolean;
  shippingDisplay: { price: number; days: number } | null;
  bestInternalShipping: any;
  currentUser: any;
  locale: Locale;
  onCepChange: (value: string) => void;
  onNumChange: (value: string) => void;
  onComplementChange: (value: string) => void;
  onCpfChange: (value: string) => void;
  onOpenMapPicker: () => void;
  onNext: () => void;
  mapContainerRef?: any;
  mapError: boolean;
  mapboxLoaded: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  cep,
  address,
  num,
  complement,
  cpf,
  cepError,
  loadingCep,
  calculatingShipping,
  shippingDisplay,
  bestInternalShipping,
  currentUser,
  locale,
  onCepChange,
  onNumChange,
  onComplementChange,
  onCpfChange,
  onOpenMapPicker,
  onNext,
  mapError,
  mapboxLoaded
}) => {
  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    onCepChange(formatted);
  };

  const handleNext = () => {
    // Validate required fields
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      Alert.alert(
        'Campo Obrigatório',
        'Por favor, preencha o CEP corretamente.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!address) {
      Alert.alert(
        'Endereço Não Encontrado',
        'Por favor, verifique o CEP ou use o localizador de endereço.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!num || !num.trim()) {
      Alert.alert(
        'Campo Obrigatório',
        'Por favor, preencha o número do endereço.',
        [{ text: 'OK' }]
      );
      return;
    }

    // All validations passed
    onNext();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MapPin size={24} color="#000000" />
        </View>
        <Text style={styles.title}>Endereço de Entrega</Text>
      </View>
      
      <View style={styles.formSection}>
        <View style={styles.cepContainer}>
          <Text style={styles.label}>CEP</Text>
          <View style={styles.cepInputWrapper}>
            <TextInput
              style={[
                styles.cepInput,
                cepError && styles.cepInputError
              ]}
              placeholder="00000-000"
              placeholderTextColor="#A3A3A3"
              maxLength={9}
              value={cep}
              onChangeText={handleCepChange}
              keyboardType="numeric"
            />
            <View style={styles.cepIcon}>
              {loadingCep ? (
                <Loader2 size={20} color="#737373" />
              ) : (
                <Search size={20} color="#737373" />
              )}
            </View>
          </View>
          <View style={styles.cepActions}>
            <TouchableOpacity onPress={onOpenMapPicker} style={styles.mapPickerButton}>
              <Navigation size={12} color="#737373" />
              <Text style={styles.mapPickerText}>Não sei meu CEP</Text>
            </TouchableOpacity>
            {cepError && (
              <View style={styles.errorContainer}>
                <AlertCircle size={12} color="#EF4444" />
                <Text style={styles.errorText}>{cepError}</Text>
              </View>
            )}
          </View>
        </View>
        
        {address && (
          <View style={styles.addressContainer}>
            <View style={styles.addressCard}>
              <Text style={styles.addressLabel}>Destino Identificado</Text>
              <Text style={styles.addressStreet}>{address.logradouro}</Text>
              <Text style={styles.addressDetails}>
                {address.bairro}, {address.localidade} - {address.uf}
              </Text>
            </View>

            <View style={styles.addressFields}>
              <View style={styles.numField}>
                <Text style={styles.label}>Número</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor="#A3A3A3"
                  value={num}
                  onChangeText={onNumChange}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.complementField}>
                <Text style={styles.label}>Complemento (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Apto, Bloco, etc"
                  placeholderTextColor="#A3A3A3"
                  value={complement}
                  onChangeText={onComplementChange}
                />
              </View>

              <View style={styles.cpfField}>
                <Text style={styles.label}>CPF (opcional para nota fiscal)</Text>
                <TextInput
                  style={[styles.input, styles.cpfInput]}
                  placeholder="000.000.000-00"
                  placeholderTextColor="#A3A3A3"
                  value={cpf}
                  onChangeText={(text) => onCpfChange(maskCPF(text))}
                  keyboardType="numeric"
                  maxLength={14}
                />
              </View>
            </View>

            {shippingDisplay && !calculatingShipping && (
              <View style={styles.shippingInfo}>
                <Text style={styles.shippingLabel}>Frete</Text>
                <View style={styles.shippingValue}>
                  <Text style={styles.shippingStriked}>
                    {shippingDisplay.price > 0 ? `R$ ${shippingDisplay.price.toFixed(2)}` : 'Calculado'}
                  </Text>
                  <Text style={styles.shippingFree}>GRÁTIS</Text>
                </View>
                <Text style={styles.shippingDays}>
                  Prazo estimado: {shippingDisplay.days} dias úteis
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleNext}
              style={[
                styles.nextButton,
                (!num.trim() || !address) && styles.nextButtonDisabled
              ]}
              disabled={!num.trim() || !address}
            >
              <Text style={styles.nextButtonText}>Continuar</Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 40,
  },
  iconContainer: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  formSection: {
    gap: 32,
  },
  cepContainer: {
    gap: 16,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  cepInputWrapper: {
    position: 'relative',
  },
  cepInput: {
    width: '100%',
    padding: 24,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 16,
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    color: '#000000',
  },
  cepInputError: {
    borderColor: '#FECACA',
    backgroundColor: 'rgba(254, 202, 202, 0.2)',
  },
  cepIcon: {
    position: 'absolute',
    right: 24,
    top: '50%',
    marginTop: -10,
  },
  cepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapPickerText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  addressContainer: {
    gap: 32,
  },
  addressCard: {
    backgroundColor: '#171717',
    padding: 32,
    borderRadius: 40,
    gap: 8,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  addressStreet: {
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  addressDetails: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addressFields: {
    gap: 24,
  },
  numField: {
    width: '50%',
    gap: 8,
  },
  complementField: {
    width: '100%',
    gap: 8,
  },
  cpfField: {
    width: '100%',
    gap: 8,
  },
  input: {
    width: '100%',
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 16,
    fontSize: 16,
    color: '#000000',
  },
  cpfInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  shippingInfo: {
    padding: 24,
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    gap: 8,
  },
  shippingLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  shippingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shippingStriked: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
    textDecorationLine: 'line-through',
    textDecorationColor: '#EF4444',
  },
  shippingFree: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10B981',
  },
  shippingDays: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  nextButton: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 32,
    paddingHorizontal: 40,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextButtonDisabled: {
    opacity: 0.3,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
});

