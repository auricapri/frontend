/**
 * OrderSummary Component - React Native
 * Adapted from web version
 */

import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingBag, ShieldCheck, Loader2 } from '../ui';
import { CartItem, UserMode } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { ShippingOption } from '../../services/logistics.service';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'credit_card' | 'pix';
  calculatingShipping: boolean;
  shippingDisplay: { price: number; days: number } | null;
  locale: Locale;
  getLoc: (obj: any) => string;
  userMode?: UserMode;
  shippingOptions?: ShippingOption[];
  selectedShippingOption?: ShippingOption | null;
  onSelectShippingOption?: (option: ShippingOption) => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  total,
  paymentMethod,
  calculatingShipping,
  shippingDisplay,
  locale,
  getLoc,
  userMode,
  shippingOptions = [],
  selectedShippingOption,
  onSelectShippingOption
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ShoppingBag size={20} color="#737373" />
        <Text style={styles.headerTitle}>Sua Sacola</Text>
      </View>
      
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.itemImageContainer}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {getLoc(item.name)}
              </Text>
              <Text style={styles.itemDetails}>
                {getLoc(item.color_name)} | {item.size}
              </Text>
              <Text style={styles.itemQuantity}>Qtd: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {formatCurrency(item.price * item.quantity, locale)}
            </Text>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal, locale)}</Text>
        </View>
        
        {userMode === UserMode.ATACADO && shippingOptions.length > 0 ? (
          <View style={styles.shippingOptionsContainer}>
            <Text style={styles.shippingOptionsTitle}>Opções de Frete</Text>
            {shippingOptions.map((option, idx) => {
              const isSelected = selectedShippingOption?.method === option.method;
              const isCheapest = option.real_cost === Math.min(...shippingOptions.map(o => o.real_cost));
              const isFastest = option.estimated_days === Math.min(...shippingOptions.map(o => o.estimated_days));
              
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => onSelectShippingOption?.(option)}
                  style={[
                    styles.shippingOption,
                    isSelected && styles.shippingOptionSelected
                  ]}
                >
                  <View style={styles.shippingOptionContent}>
                    <View style={styles.shippingOptionLeft}>
                      <Text style={styles.shippingOptionMethod}>
                        {option.method} - {option.provider}
                      </Text>
                      <View style={styles.shippingOptionBadges}>
                        {isCheapest && (
                          <View style={styles.badgeCheapest}>
                            <Text style={[styles.badgeText, { color: '#065F46' }]}>Mais Barato</Text>
                          </View>
                        )}
                        {isFastest && (
                          <View style={styles.badgeFastest}>
                            <Text style={[styles.badgeText, { color: '#1E40AF' }]}>Mais Rápido</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.shippingOptionRight}>
                      <Text style={styles.shippingOptionPrice}>
                        {formatCurrency(option.display_price_was, locale)}
                      </Text>
                      <Text style={styles.shippingOptionDays}>
                        {option.estimated_days} dias
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Frete</Text>
              <View style={styles.shippingValue}>
                {calculatingShipping ? (
                  <View style={styles.loadingContainer}>
                    <Loader2 size={12} color="#737373" />
                    <Text style={styles.loadingText}>Calc...</Text>
                  </View>
                ) : shippingDisplay ? (
                  <>
                    <Text style={styles.shippingStriked}>
                      {formatCurrency(shippingDisplay.price, locale)}
                    </Text>
                    <Text style={styles.shippingFree}>GRÁTIS</Text>
                  </>
                ) : (
                  <Text style={styles.shippingWaiting}>Aguardando CEP</Text>
                )}
              </View>
            </View>
            
            {shippingDisplay && !calculatingShipping && (
              <Text style={styles.shippingDays}>
                Prazo Estimado: {shippingDisplay.days} dias úteis
              </Text>
            )}
          </>
        )}

        {paymentMethod === 'pix' && (
          <View style={styles.totalRow}>
            <Text style={styles.pixDiscountLabel}>Desconto PIX (5%)</Text>
            <Text style={styles.pixDiscountValue}>
              -{formatCurrency(total * 0.05, locale)}
            </Text>
          </View>
        )}
        
        <View style={styles.totalFinal}>
          <Text style={styles.totalFinalLabel}>Total</Text>
          <Text style={styles.totalFinalValue}>
            {formatCurrency(paymentMethod === 'pix' ? total * 0.95 : total, locale)}
          </Text>
        </View>
        
        <View style={styles.securityBadge}>
          <ShieldCheck size={16} color="#10B981" />
          <Text style={styles.securityText}>Compra Segura e Criptografada</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderRadius: 48,
    padding: 40,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 6.4,
    color: '#000000',
  },
  itemsList: {
    maxHeight: 400,
    marginBottom: 48,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  itemImageContainer: {
    width: 80,
    height: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    lineHeight: 16,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 9,
    color: '#737373',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  itemQuantity: {
    fontSize: 10,
    fontWeight: '900',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -1,
  },
  totals: {
    paddingTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  shippingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  shippingStriked: {
    fontSize: 10,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    textDecorationLine: 'line-through',
    textDecorationColor: '#EF4444',
  },
  shippingFree: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#10B981',
  },
  shippingWaiting: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#A3A3A3',
  },
  shippingDays: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    textAlign: 'right',
  },
  pixDiscountLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#10B981',
  },
  pixDiscountValue: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#10B981',
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  totalFinalLabel: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  totalFinalValue: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: -2,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  securityText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#10B981',
  },
  shippingOptionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  shippingOptionsTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    marginBottom: 8,
  },
  shippingOption: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
  },
  shippingOptionSelected: {
    borderColor: '#000000',
    backgroundColor: '#FAFAFA',
  },
  shippingOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shippingOptionLeft: {
    flex: 1,
    marginRight: 16,
  },
  shippingOptionMethod: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#000000',
    marginBottom: 4,
  },
  shippingOptionBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badgeCheapest: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeFastest: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shippingOptionRight: {
    alignItems: 'flex-end',
  },
  shippingOptionPrice: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#000000',
  },
  shippingOptionDays: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    marginTop: 2,
  },
});
