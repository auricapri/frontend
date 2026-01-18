/**
 * OrderResultOverlay Component - React Native
 * Adapted from web version
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { ArrowRight, RefreshCw, XCircle, CheckCircle2 } from '../ui/Icons';
import { Locale } from '../../i18n';

interface OrderResultOverlayProps {
  status: 'success' | 'error';
  orderId?: string;
  errorMessage?: string;
  onClose: () => void;
  t: (key: string) => any;
  locale: Locale;
}

const OrderResultOverlay: React.FC<OrderResultOverlayProps> = ({ 
  status, 
  orderId, 
  errorMessage, 
  onClose,
  t,
  locale 
}) => {
  const [showContent, setShowContent] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Reveal content
    const timer = setTimeout(() => setShowContent(true), 100);
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    
    // If success, auto-close after 2.5 seconds
    let closeTimer: any;
    if (status === 'success') {
      closeTimer = setTimeout(() => {
        onClose();
      }, 2500);
    }

    return () => {
      clearTimeout(timer);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [status, onClose, fadeAnim, scaleAnim]);

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {status === 'success' ? (
            <>
              <View style={styles.iconContainer}>
                <CheckCircle2 size={80} color="#10B981" />
              </View>
              <Text style={styles.title}>Confirmed</Text>
              
              {orderId && (
                <View style={styles.orderIdContainer}>
                  <Text style={styles.orderIdLabel}>Order ID</Text>
                  <Text style={styles.orderIdValue}>{orderId.slice(0, 8).toUpperCase()}</Text>
                </View>
              )}
              
              <Text style={styles.message}>
                Your order has been successfully placed. Redirecting to receipt...
              </Text>
            </>
          ) : (
            <>
              <View style={styles.iconContainer}>
                <XCircle size={80} color="#EF4444" />
              </View>
              <Text style={[styles.title, styles.titleError]}>Payment Declined</Text>
              
              {errorMessage && (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              )}
              
              <TouchableOpacity onPress={onClose} style={styles.retryButton}>
                <RefreshCw size={20} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Try Again</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 512,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 6.4,
    textAlign: 'center',
    marginBottom: 32,
  },
  titleError: {
    color: '#EF4444',
  },
  orderIdContainer: {
    marginBottom: 32,
    padding: 24,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    gap: 8,
  },
  orderIdLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    textAlign: 'center',
  },
  orderIdValue: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 2,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: '#404040',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 32,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
});

export default OrderResultOverlay;

