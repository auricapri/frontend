/**
 * CartDrawer Component - React Native
 * Adapted from web version
 */

import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Minus, Plus, Trash2, ArrowRight } from '../ui';
import { Drawer } from '../ui/Drawer';
import { CartItem, UserMode } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { rp, scaleFont } from '../../utils/responsive';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  userMode: UserMode;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  t: (key: string) => any;
  locale: Locale;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  userMode, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout,
  t, 
  locale 
}) => {
  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const subtotal = items.reduce((sum, item) => {
    const price = item.price;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={undefined} side="right" width={undefined}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>{t('cart.title')} ({items.length})</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('cart.empty')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.continueButton}>
            <Text style={styles.continueButtonText}>{t('cart.continue')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const price = item.price;
              return (
                <View key={`${item.variant_id}-${item.size}-${item.color_hex}`} style={styles.itemContainer}>
                  <View style={styles.itemImageContainer}>
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                  </View>
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName} numberOfLines={2}>{getLoc(item.name)}</Text>
                      <Text style={styles.itemPrice}>{formatCurrency(price * item.quantity, locale)}</Text>
                    </View>
                    <Text style={styles.itemDetails}>{getLoc(item.color_name)} / {item.size}</Text>

                    <View style={styles.itemActions}>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          onPress={() => onUpdateQuantity(item.variant_id, -1)}
                          style={styles.quantityButton}
                        >
                          <Minus size={12} color="#000000" />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() => onUpdateQuantity(item.variant_id, 1)}
                          style={styles.quantityButton}
                        >
                          <Plus size={12} color="#000000" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() => onRemoveItem(item.variant_id)}
                        style={styles.removeButton}
                      >
                        <Trash2 size={16} color="#737373" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.subtotalContainer}>
              <Text style={styles.subtotalLabel}>{t('cart.subtotal')}</Text>
              <Text style={styles.subtotalValue}>{formatCurrency(subtotal, locale)}</Text>
            </View>
            <TouchableOpacity onPress={onCheckout} style={styles.checkoutButton}>
              <View style={styles.checkoutButtonInner}>
                <Text style={styles.checkoutButtonText}>{t('cart.checkout')}</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}
    </Drawer>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: rp(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  drawerTitle: {
    fontSize: scaleFont(18, 0.4),
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(18, 0.4) * 0.11,
    color: '#000000',
  },
  closeButton: {
    padding: rp(4),
    borderRadius: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: rp(12),
    paddingVertical: rp(40),
  },
  emptyText: {
    fontSize: scaleFont(24, 0.5),
    fontWeight: '300',
    color: '#737373',
  },
  continueButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#000000',
  },
  itemsList: {
    flex: 1,
    padding: rp(16),
  },
  itemContainer: {
    flexDirection: 'row',
    gap: rp(16),
    marginBottom: rp(20),
  },
  itemImageContainer: {
    width: 80, // Smaller for mobile
    height: 100, // Smaller for mobile
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: scaleFont(10, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    lineHeight: scaleFont(10, 0.3) * 1.5,
    marginRight: rp(6),
  },
  itemPrice: {
    fontSize: scaleFont(12, 0.3),
    fontWeight: '300',
    color: '#000000',
  },
  itemDetails: {
    fontSize: scaleFont(8, 0.3),
    color: '#737373',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    padding: rp(16),
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    gap: rp(12),
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#000000',
  },
  subtotalValue: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: -1,
    color: '#000000',
  },
  checkoutButton: {
    width: '100%',
  },
  checkoutButtonInner: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 32,
    paddingHorizontal: 40,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginRight: 8,
  },
});

export default CartDrawer;

