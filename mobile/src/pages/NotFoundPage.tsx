/**
 * NotFoundPage Component - React Native
 * Adapted from web version
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, ArrowLeft, AlertCircle } from '../components/ui/Icons';
import { Locale } from '../i18n';

interface NotFoundPageProps {
  locale: Locale;
  onNavigate: (view: 'home' | 'product' | 'collection' | 'checkout' | 'receipt' | 'about', target?: string) => void;
  t: (key: string) => any;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ locale, onNavigate, t }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 404 Number */}
        <View style={styles.headerSection}>
          <Text style={styles.errorNumber}>404</Text>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <AlertCircle size={20} color="#A3A3A3" />
            <View style={styles.divider} />
          </View>
        </View>

        {/* Message */}
        <View style={styles.messageSection}>
          <Text style={styles.title}>Página Não Encontrada</Text>
          <Text style={styles.description}>
            A página que você está procurando não existe ou foi movida. 
            Verifique o endereço e tente novamente.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            onPress={() => onNavigate('home')}
            style={styles.primaryButton}
          >
            <Home size={16} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Voltar ao Início</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              // In React Native, we can't use window.history.back()
              // So we navigate to home instead
              onNavigate('home');
            }}
            style={styles.secondaryButton}
          >
            <ArrowLeft size={16} color="#000000" />
            <Text style={styles.secondaryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>

        {/* Decorative Elements */}
        <View style={styles.footerSection}>
          <View style={styles.errorLabel}>
            <Text style={styles.errorLabelText}>ERRO</Text>
            <View style={styles.dot} />
            <Text style={styles.errorLabelText}>404</Text>
            <View style={styles.dot} />
            <Text style={styles.errorLabelText}>NOT FOUND</Text>
          </View>
          
          {/* Links Úteis */}
          <View style={styles.usefulLinks}>
            <TouchableOpacity onPress={() => onNavigate('home')}>
              <Text style={styles.linkText}>Início</Text>
            </TouchableOpacity>
            <View style={styles.dot} />
            <TouchableOpacity onPress={() => onNavigate('about')}>
              <Text style={styles.linkText}>Sobre</Text>
            </TouchableOpacity>
            <View style={styles.dot} />
            <TouchableOpacity onPress={() => onNavigate('home', 'collection')}>
              <Text style={styles.linkText}>Coleções</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  headerSection: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 48,
  },
  errorNumber: {
    fontSize: 120,
    fontWeight: '300',
    letterSpacing: -6,
    color: '#000000',
    lineHeight: 120,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    width: 64,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  messageSection: {
    alignItems: 'center',
    gap: 24,
    marginBottom: 32,
    maxWidth: 512,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    textAlign: 'center',
    color: '#000000',
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 64,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#000000',
    borderRadius: 32,
  },
  primaryButtonText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 32,
  },
  secondaryButtonText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    color: '#000000',
  },
  footerSection: {
    alignItems: 'center',
    gap: 32,
  },
  errorLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorLabelText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 6.4,
    color: '#A3A3A3',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A3A3A3',
  },
  usefulLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
});

export default NotFoundPage;

