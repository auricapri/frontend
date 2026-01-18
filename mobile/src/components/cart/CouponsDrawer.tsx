/**
 * CouponsDrawer Component - React Native
 * Adapted from web version
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Clipboard } from 'react-native';
import { X, Ticket, Copy, Check } from '../ui';
import { Drawer } from '../ui/Drawer';
import { Coupon } from '../../types';
import { couponsApi } from '../../api/instances';
import { Loader2 } from '../ui';

// Cache de cupons (TTL 5 min)
let couponsCache: { coupons: Coupon[]; timestamp: number } | null = null;
const COUPONS_CACHE_TTL = 5 * 60 * 1000;

interface CouponsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => any;
}

const CouponsDrawer: React.FC<CouponsDrawerProps> = ({ isOpen, onClose, t }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (isOpen) {
      const fetchCoupons = async () => {
        // Verifica cache
        if (couponsCache && Date.now() - couponsCache.timestamp < COUPONS_CACHE_TTL) {
          setCoupons(couponsCache.coupons);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        try {
          const data = await couponsApi.getAll();
          if (!isMounted.current) return;

          setCoupons(data);
          // Atualiza cache
          couponsCache = { coupons: data, timestamp: Date.now() };
        } catch (err) {
          console.error('Error fetching coupons:', err);
        } finally {
          if (isMounted.current) setIsLoading(false);
        }
      };
      fetchCoupons();
    }

    return () => {
      isMounted.current = false;
    };
  }, [isOpen]);

  const formatDiscount = (coupon: Coupon): string => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `R$ ${coupon.discount_value.toFixed(2)}`;
  };

  const formatExpires = (coupon: Coupon): string => {
    if (!coupon.expires_at) return 'No expiration';
    const expires = new Date(coupon.expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'Expired';
    if (daysLeft === 0) return 'Expires today';
    if (daysLeft === 1) return 'Expires tomorrow';
    return `Expires in ${daysLeft} days`;
  };

  const getCouponColor = (coupon: Coupon): { backgroundColor: string; color: string; borderColor?: string } => {
    if (coupon.discount_type === 'percentage' && coupon.discount_value >= 20) {
      return { backgroundColor: '#171717', color: '#FFFFFF' };
    }
    if (coupon.discount_type === 'fixed' && coupon.discount_value >= 100) {
      return { backgroundColor: '#000000', color: '#FFFFFF' };
    }
    return { backgroundColor: '#F5F5F5', color: '#000000', borderColor: '#E5E5E5' };
  };

  const handleCopy = (code: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    } else {
      Clipboard.setString(code);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={undefined} side="right" width={400}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ticket size={20} color="#000000" />
          <Text style={styles.headerTitle}>{t('nav.coupons')}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>Available offers for your next purchase.</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Loader2 size={24} color="#737373" />
            <Text style={styles.loadingText}>Loading coupons...</Text>
          </View>
        ) : coupons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No coupons available at the moment.</Text>
          </View>
        ) : (
          <View style={styles.couponsList}>
            {coupons.map((coupon) => {
              const colors = getCouponColor(coupon);
              const isCopied = copiedCode === coupon.code;
              
              return (
                <View key={coupon.id} style={[styles.couponCard, colors]}>
                  <View style={styles.couponHeader}>
                    <View style={styles.couponDiscount}>
                      <Text style={[styles.discountText, { color: colors.color }]}>
                        {formatDiscount(coupon)}
                      </Text>
                      <Text style={[styles.offText, { color: colors.color }]}>OFF</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleCopy(coupon.code)}
                      style={styles.copyButton}
                    >
                      {isCopied ? (
                        <Check size={16} color={colors.color} />
                      ) : (
                        <Copy size={16} color={colors.color} />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.couponCode, { color: colors.color }]}>{coupon.code}</Text>
                  {coupon.description && (
                    <Text style={[styles.couponDescription, { color: colors.color, opacity: 0.8 }]}>
                      {coupon.description}
                    </Text>
                  )}
                  <Text style={[styles.couponExpires, { color: colors.color, opacity: 0.6 }]}>
                    {formatExpires(coupon)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Drawer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#000000',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FAFAFA',
  },
  description: {
    fontSize: 14,
    color: '#404040',
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#737373',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#737373',
  },
  couponsList: {
    gap: 16,
  },
  couponCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  couponDiscount: {
    gap: 4,
  },
  discountText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -2,
  },
  offText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  couponCode: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3.2,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  couponDescription: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 8,
  },
  couponExpires: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
});

export default CouponsDrawer;

