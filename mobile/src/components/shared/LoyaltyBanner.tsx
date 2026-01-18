/**
 * LoyaltyBanner Component - React Native
 * Adapted from web version
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Clipboard } from 'react-native';
import { Trophy, X, Sparkles, Copy, Check } from '../ui';
import { formatCurrency } from '../../utils/currency';
import { Locale } from '../../i18n';

interface LoyaltyBannerProps {
  isVisible: boolean;
  level: number;
  rewardValue: number;
  couponCode: string;
  expiresAt: string;
  onClose: () => void;
  onOpenCoupons: () => void;
  locale: Locale;
}

const LoyaltyBanner: React.FC<LoyaltyBannerProps> = ({ 
  isVisible, 
  level, 
  rewardValue, 
  couponCode, 
  onClose, 
  locale
}) => {
  const [copied, setCopied] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [isVisible]);

  const handleCopy = () => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(couponCode);
      }
    } else {
      Clipboard.setString(couponCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          })}],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.banner}>
        {/* Icon Circle */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Trophy size={24} color="#000000" strokeWidth={1.5} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.levelText}>Level {level} Unlocked</Text>
            <Sparkles size={12} color="#FCD34D" />
          </View>
          <Text style={styles.description} numberOfLines={1}>
            Ganhou <Text style={styles.valueText}>{formatCurrency(rewardValue, locale)}</Text> OFF: <Text style={styles.codeText}>{couponCode}</Text>
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
            {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} color="#737373" />}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.actionButton}>
            <X size={16} color="#737373" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    zIndex: 5000,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  banner: {
    width: '100%',
    maxWidth: 448,
    backgroundColor: 'rgba(23, 23, 23, 0.95)',
    borderRadius: 999,
    padding: 8,
    paddingRight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginLeft: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3.2,
    color: '#FCD34D',
  },
  description: {
    fontSize: 12,
    fontWeight: '400',
    color: '#D4D4D4',
  },
  valueText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#FCD34D',
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    paddingLeft: 16,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
  },
});

export default LoyaltyBanner;

