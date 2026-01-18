/**
 * Error Page - React Native
 * Shows friendly error message when backend is unavailable
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle } from '../components/ui/Icons';

interface ErrorPageProps {
  onRetry: () => void;
  t: (key: string) => string;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ onRetry, t }) => {
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AlertCircle size={48} color="#737373" />
        </View>

        <Text style={styles.title}>Serviços Temporariamente Indisponíveis</Text>

        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            Nossos serviços estão temporariamente fora do ar.
          </Text>
          <Text style={[styles.message, { marginTop: 12 }]}>
            Por favor, tente novamente em alguns minutos.
          </Text>
        </View>

        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Se o problema persistir, entre em contato com nosso suporte.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 24,
    color: '#171717',
  },
  messageContainer: {
    marginBottom: 32,
  },
  message: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#171717',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 2,
    marginBottom: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#A3A3A3',
    textAlign: 'center',
  },
});

export default ErrorPage;

