/**
 * ResetPasswordPage Component - React Native
 * Adapted from web version
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { Lock, Eye, EyeOff, Check, Loader2, ArrowLeft } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { supabase } from '../utils/supabase';
import { Locale } from '../i18n';

interface ResetPasswordPageProps {
  locale: Locale;
  onNavigate: (view: 'home' | 'product' | 'collection' | 'checkout' | 'receipt' | 'about', target?: string) => void;
  t: (key: string) => any;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ locale, onNavigate, t }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  useEffect(() => {
    // Check if we have a valid session/token
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // On web, try to get session from URL hash
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const type = hashParams.get('type');
            
            if (type === 'recovery' && accessToken) {
              // Session will be set automatically by Supabase
              setTimeout(() => setIsValidatingToken(false), 1000);
            } else {
              setError('Link de recuperação inválido ou expirado.');
              setIsValidatingToken(false);
            }
          } else {
            setError('Link de recuperação inválido ou expirado.');
            setIsValidatingToken(false);
          }
        } else {
          setIsValidatingToken(false);
        }
      } catch (err) {
        setError('Erro ao validar o link de recuperação.');
        setIsValidatingToken(false);
      }
    };

    checkSession();
  }, []);

  const handleResetPassword = async () => {
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        onNavigate('home');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir a senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Loader2 size={48} color="#A3A3A3" />
          <Text style={styles.loadingText}>Validando link de recuperação...</Text>
        </View>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Check size={40} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Senha Redefinida</Text>
          <Text style={styles.successMessage}>
            Sua senha foi redefinida com sucesso! Você será redirecionado para a página inicial.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Lock size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Nova Senha</Text>
        <Text style={styles.subtitle}>
          Digite sua nova senha abaixo. Certifique-se de que ela tenha pelo menos 6 caracteres.
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Nova Senha</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry={!showPassword}
              placeholderTextColor="#A3A3A3"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? (
                <EyeOff size={20} color="#737373" />
              ) : (
                <Eye size={20} color="#737373" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Confirmar Senha</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Digite a senha novamente"
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor="#A3A3A3"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#737373" />
              ) : (
                <Eye size={20} color="#737373" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <Button
          onPress={handleResetPassword}
          disabled={isLoading || !password || !confirmPassword}
          variant="primary"
          size="md"
          isLoading={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Redefinindo...</Text>
            </>
          ) : (
            <>
              <Lock size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Redefinir Senha</Text>
            </>
          )}
        </Button>
      </View>

      {/* Back to Home */}
      <TouchableOpacity
        onPress={() => onNavigate('home')}
        style={styles.backLink}
      >
        <ArrowLeft size={16} color="#737373" />
        <Text style={styles.backLinkText}>Voltar ao início</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    maxWidth: 448,
  },
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#ECFDF5',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
    maxWidth: 448,
  },
  headerIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#000000',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    width: '100%',
    maxWidth: 448,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#DC2626',
  },
  form: {
    width: '100%',
    maxWidth: 448,
    gap: 24,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    paddingHorizontal: 16,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    width: '100%',
    padding: 20,
    paddingRight: 56,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 16,
    fontSize: 14,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 20,
    padding: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
  },
});

export default ResetPasswordPage;

