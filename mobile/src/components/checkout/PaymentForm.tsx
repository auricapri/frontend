/**
 * PaymentForm Component - React Native
 * Adapted from web version
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Clipboard, Alert } from 'react-native';
import { CreditCard, QrCode, Copy, Check, Lock, CheckCircle2, ChevronRight, ArrowLeft } from '../ui/Icons';
import { UserProfile, StoreConfig, SavedCard } from '../../types';
import { Locale } from '../../i18n';

type PaymentMethod = 'credit_card' | 'pix';

export interface CardData {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
}

interface PaymentFormProps {
  paymentMethod: PaymentMethod;
  currentUser: UserProfile | null;
  storeConfig?: StoreConfig;
  selectedSavedCardId: string | null;
  saveCardForFuture: boolean;
  pixCopied: boolean;
  locale: Locale;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onSavedCardSelect: (cardId: string | null) => void;
  onSaveCardToggle: (save: boolean) => void;
  onCopyPix: () => void;
  onBack: () => void;
  onNext: () => void;
  onCardDataChange?: (cardData: CardData | null) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentMethod,
  currentUser,
  storeConfig,
  selectedSavedCardId,
  saveCardForFuture,
  pixCopied,
  locale,
  onPaymentMethodChange,
  onSavedCardSelect,
  onSaveCardToggle,
  onCopyPix,
  onBack,
  onNext,
  onCardDataChange
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const handleCopyPix = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(storeConfig?.pix_key || '');
    } else {
      Clipboard.setString(storeConfig?.pix_key || '');
    }
    onCopyPix();
  };

  const formatCardNumber = (card: SavedCard): string => {
    if (!card.last4) return '•••• •••• •••• ••••';
    return `•••• •••• •••• ${card.last4}`;
  };

  const formatExpiry = (card: SavedCard): string => {
    if (!card.exp_month || !card.exp_year) return '';
    const month = String(card.exp_month).padStart(2, '0');
    // Handle both 2-digit (30) and 4-digit (2030) years
    let year = card.exp_year;
    if (year < 100) {
      year = 2000 + year;
    }
    return `EXP: ${month}/${year}`;
  };

  const formatCardNumberInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const formatted = digits.match(/.{1,4}/g)?.join(' ') || digits;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  };

  // Notify parent when card data changes
  useEffect(() => {
    if (onCardDataChange) {
      if (paymentMethod === 'credit_card' && !selectedSavedCardId && cardNumber && cardName && cardExpiry && cardCvc) {
        onCardDataChange({
          number: cardNumber.replace(/\D/g, ''),
          name: cardName,
          expiry: cardExpiry.replace(/\D/g, ''),
          cvc: cardCvc
        });
      } else {
        onCardDataChange(null);
      }
    }
  }, [cardNumber, cardName, cardExpiry, cardCvc, paymentMethod, selectedSavedCardId, onCardDataChange]);

  const handleNext = () => {
    if (paymentMethod === 'credit_card' && !selectedSavedCardId) {
      // Validate card fields
      const cleanedCardNumber = cardNumber.replace(/\D/g, '');
      if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
        Alert.alert(
          'Cartão Inválido',
          'Por favor, preencha o número do cartão corretamente.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!cardName.trim()) {
        Alert.alert(
          'Campo Obrigatório',
          'Por favor, preencha o nome no cartão.',
          [{ text: 'OK' }]
        );
        return;
      }

      const cleanedExpiry = cardExpiry.replace(/\D/g, '');
      if (cleanedExpiry.length !== 4) {
        Alert.alert(
          'Data Inválida',
          'Por favor, preencha a validade do cartão (MM/AA).',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!cardCvc || cardCvc.length < 3) {
        Alert.alert(
          'CVC Inválido',
          'Por favor, preencha o CVC do cartão.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    onNext();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <CreditCard size={24} color="#000000" />
        </View>
        <Text style={styles.title}>Método de Pagamento</Text>
      </View>
      
      {/* Method Selection */}
      <View style={styles.methodSelection}>
        <TouchableOpacity
          onPress={() => {
            onPaymentMethodChange('credit_card');
            onSavedCardSelect(null);
          }}
          style={[
            styles.methodButton,
            paymentMethod === 'credit_card' && styles.methodButtonActive
          ]}
        >
          <CreditCard size={32} color={paymentMethod === 'credit_card' ? '#000000' : '#737373'} />
          <View style={styles.methodInfo}>
            <Text style={[
              styles.methodTitle,
              paymentMethod === 'credit_card' && styles.methodTitleActive
            ]}>
              Cartão de Crédito
            </Text>
            <Text style={styles.methodSubtitle}>Até 10x sem juros</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => onPaymentMethodChange('pix')}
          style={[
            styles.methodButton,
            paymentMethod === 'pix' && styles.methodButtonActive
          ]}
        >
          <View style={[
            styles.pixIconContainer,
            paymentMethod === 'pix' && styles.pixIconContainerActive
          ]}>
            <Text style={[
              styles.pixIconText,
              paymentMethod === 'pix' && styles.pixIconTextActive
            ]}>
              PIX
            </Text>
          </View>
          <View style={styles.methodInfo}>
            <Text style={[
              styles.methodTitle,
              paymentMethod === 'pix' && styles.methodTitleActive
            ]}>
              PIX Instantâneo
            </Text>
            <Text style={[
              styles.methodSubtitle,
              styles.methodSubtitlePix
            ]}>
              5% de desconto
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {paymentMethod === 'credit_card' && (
        <View style={styles.creditCardSection}>
          {/* Saved Cards */}
          {currentUser?.saved_cards && currentUser.saved_cards.length > 0 && (
            <View style={styles.savedCardsSection}>
              <Text style={styles.sectionLabel}>Cartões Salvos</Text>
              {currentUser.saved_cards.map((card: SavedCard) => (
                <TouchableOpacity
                  key={card.id}
                  onPress={() => onSavedCardSelect(card.id)}
                  style={[
                    styles.savedCardItem,
                    selectedSavedCardId === card.id && styles.savedCardItemActive
                  ]}
                >
                  <View style={styles.savedCardContent}>
                    <View style={[
                      styles.cardBrandBadge,
                      selectedSavedCardId === card.id && styles.cardBrandBadgeActive
                    ]}>
                      <Text style={[
                        styles.cardBrandText,
                        selectedSavedCardId === card.id && styles.cardBrandTextActive
                      ]}>
                        {card.brand?.toUpperCase() || 'CARD'}
                      </Text>
                    </View>
                    <View style={styles.savedCardInfo}>
                      <Text style={[
                        styles.savedCardNumber,
                        selectedSavedCardId === card.id && styles.savedCardNumberActive
                      ]}>
                        {formatCardNumber(card)}
                      </Text>
                      <Text style={[
                        styles.savedCardExpiry,
                        selectedSavedCardId === card.id && styles.savedCardExpiryActive
                      ]}>
                        {formatExpiry(card)}
                      </Text>
                    </View>
                  </View>
                  {selectedSavedCardId === card.id && (
                    <CheckCircle2 size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* New Card Form */}
          {!selectedSavedCardId && (
            <View style={styles.newCardForm}>
              <View style={styles.cardFormRow}>
                <View style={styles.cardFormField}>
                  <Text style={styles.cardFormLabel}>Número do Cartão</Text>
                  <TextInput
                    style={styles.cardFormInput}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor="#525252"
                    value={cardNumber}
                    onChangeText={(text) => setCardNumber(formatCardNumberInput(text))}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>
                <View style={styles.cardFormField}>
                  <Text style={styles.cardFormLabel}>Nome no Cartão</Text>
                  <TextInput
                    style={styles.cardFormInput}
                    placeholder="NOME COMO IMPRESSO"
                    placeholderTextColor="#525252"
                    value={cardName}
                    onChangeText={(text) => setCardName(text.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              <View style={styles.cardFormRow}>
                <View style={[styles.cardFormField, styles.cardFormFieldHalf]}>
                  <Text style={styles.cardFormLabel}>Validade</Text>
                  <TextInput
                    style={styles.cardFormInput}
                    placeholder="MM/AA"
                    placeholderTextColor="#525252"
                    value={cardExpiry}
                    onChangeText={(text) => setCardExpiry(formatExpiryInput(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.cardFormField, styles.cardFormFieldHalf]}>
                  <Text style={styles.cardFormLabel}>CVC</Text>
                  <TextInput
                    style={styles.cardFormInput}
                    placeholder="123"
                    placeholderTextColor="#525252"
                    value={cardCvc}
                    onChangeText={(text) => setCardCvc(text.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Save Card Option */}
              {currentUser && (
                <TouchableOpacity
                  onPress={() => onSaveCardToggle(!saveCardForFuture)}
                  style={styles.saveCardOption}
                >
                  <View style={[
                    styles.checkbox,
                    saveCardForFuture && styles.checkboxActive
                  ]}>
                    {saveCardForFuture && <Check size={16} color="#000000" />}
                  </View>
                  <View style={styles.saveCardTextContainer}>
                    <Text style={styles.saveCardText}>Salvar Cartão</Text>
                    <Text style={styles.saveCardSubtext}>
                      Armazenamento seguro criptografado para compras futuras.
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Note: In a real app, you would integrate with a payment gateway like Stripe */}
          <View style={styles.noteContainer}>
            <Lock size={16} color="#737373" />
            <Text style={styles.noteText}>
              Seus dados são protegidos e criptografados. Não armazenamos informações completas do cartão.
            </Text>
          </View>
        </View>
      )}

      {paymentMethod === 'pix' && (
        <View style={styles.pixSection}>
          <View style={styles.pixCard}>
            <View style={styles.pixHeader}>
              <QrCode size={32} color="#000000" />
              <Text style={styles.pixTitle}>PIX Copia e Cola</Text>
            </View>
            <View style={styles.pixKeyContainer}>
              <Text style={styles.pixKey} numberOfLines={2}>
                {storeConfig?.pix_key || 'Chave PIX não configurada'}
              </Text>
              <TouchableOpacity onPress={handleCopyPix} style={styles.copyButton}>
                {pixCopied ? (
                  <>
                    <Check size={16} color="#10B981" />
                    <Text style={styles.copyButtonTextCopied}>Copiado!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color="#000000" />
                    <Text style={styles.copyButtonText}>Copiar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.pixInstructions}>
              Copie a chave PIX e cole no app do seu banco para efetuar o pagamento. 
              O desconto de 5% será aplicado automaticamente.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={16} color="#737373" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>Continuar</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
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
  methodSelection: {
    gap: 24,
  },
  methodButton: {
    padding: 40,
    borderWidth: 2,
    borderColor: '#F5F5F5',
    borderRadius: 40,
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  methodButtonActive: {
    borderColor: '#000000',
    backgroundColor: '#FAFAFA',
  },
  methodInfo: {
    alignItems: 'center',
    gap: 4,
  },
  methodTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  methodTitleActive: {
    color: '#000000',
  },
  methodSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  methodSubtitlePix: {
    color: '#10B981',
    fontWeight: '900',
  },
  pixIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#000000',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixIconContainerActive: {
    backgroundColor: '#000000',
  },
  pixIconText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pixIconTextActive: {
    color: '#FFFFFF',
  },
  creditCardSection: {
    gap: 32,
  },
  savedCardsSection: {
    gap: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    paddingHorizontal: 8,
  },
  savedCardItem: {
    padding: 24,
    borderWidth: 2,
    borderColor: '#F5F5F5',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  savedCardItemActive: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  savedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  cardBrandBadge: {
    width: 40,
    height: 24,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBrandBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardBrandText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  cardBrandTextActive: {
    color: '#FFFFFF',
  },
  savedCardInfo: {
    gap: 4,
  },
  savedCardNumber: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    color: '#000000',
  },
  savedCardNumberActive: {
    color: '#FFFFFF',
  },
  savedCardExpiry: {
    fontSize: 12,
    fontWeight: '400',
    color: '#737373',
  },
  savedCardExpiryActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  newCardForm: {
    padding: 32,
    backgroundColor: 'rgba(250, 250, 250, 0.5)',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    gap: 24,
  },
  cardFormRow: {
    flexDirection: 'row',
    gap: 24,
  },
  cardFormField: {
    flex: 1,
    gap: 8,
  },
  cardFormFieldHalf: {
    flex: 0.5,
  },
  cardFormLabel: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    paddingHorizontal: 16,
  },
  cardFormInput: {
    width: '100%',
    padding: 24,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 24,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  saveCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#525252',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  saveCardTextContainer: {
    flex: 1,
    gap: 4,
  },
  saveCardText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  saveCardSubtext: {
    fontSize: 9,
    fontWeight: '400',
    color: '#737373',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 24,
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: '#737373',
    lineHeight: 18,
  },
  pixSection: {
    gap: 24,
  },
  pixCard: {
    padding: 32,
    backgroundColor: '#FAFAFA',
    borderRadius: 40,
    gap: 24,
  },
  pixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pixTitle: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  pixKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  pixKey: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#000000',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#000000',
  },
  copyButtonTextCopied: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#10B981',
  },
  pixInstructions: {
    fontSize: 12,
    fontWeight: '400',
    color: '#737373',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#000000',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
});

