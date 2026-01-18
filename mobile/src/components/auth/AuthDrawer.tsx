/**
 * AuthDrawer Component - React Native
 * Adapted from web version
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, ScrollView, Alert } from 'react-native';
import { Apple, Loader2, ShoppingBag, Mail, ArrowLeft, Check } from '../ui/Icons';
import { Drawer } from '../ui/Drawer';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { UserProfile as UserType } from '../../types';
import { Locale } from '../../i18n';
import { supabase } from '../../utils/supabase';
import UserProfileView from './UserProfileView';
import { getDrawerWidth, rp, scaleFont } from '../../utils/responsive';
import OAuthWebView from './OAuthWebView';

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onLogin: (user: UserType) => void;
  onLogout: () => void;
  t: (key: string) => any;
  locale: Locale;
}

const AuthDrawer: React.FC<AuthDrawerProps> = ({ isOpen, onClose, user, onLogin, onLogout, t, locale }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [showOAuthWebView, setShowOAuthWebView] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Reset social loading when user logs in successfully
  useEffect(() => {
    if (user && socialLoading) {
      setSocialLoading(null);
    }
  }, [user, socialLoading]);

  const handleAuth = async () => {
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        Alert.alert('Sucesso', 'Cadastro realizado! Verifique seu email para confirmar.');
        setAuthMode('login');
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    try {
      // Use deep link for mobile, web URL for web
      const redirectUrl = Platform.OS === 'web' 
        ? (typeof window !== 'undefined' ? window.location.origin : '')
        : 'auricapri://auth';
      
      if (!redirectUrl) {
        throw new Error('Redirect URL não configurada');
      }
      
      console.log('OAuth redirect URL:', redirectUrl);
      
      // On mobile, use WebView instead of external browser
      if (Platform.OS !== 'web') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true, // Always skip browser redirect on mobile
          }
        });
        
        if (error) {
          console.error('OAuth error:', error);
          throw error;
        }
        
        if (data?.url) {
          // Open WebView with OAuth URL
          setOauthUrl(data.url);
          setShowOAuthWebView(true);
          // Don't reset loading state here - wait for WebView callback
        } else {
          throw new Error('URL de autenticação não retornada');
        }
      } else {
        // On web, use normal OAuth flow
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: false,
          }
        });
        
        if (error) {
          console.error('OAuth error:', error);
          throw error;
        }
        
        // On web, the redirect happens automatically
        setSocialLoading(null);
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      Alert.alert('Erro', `Erro no login social: ${err.message || 'Erro desconhecido'}`);
      setSocialLoading(null);
    }
  };

  const handleOAuthSuccess = () => {
    setSocialLoading(null);
    setShowOAuthWebView(false);
    setOauthUrl(null);
    onClose();
    Alert.alert('Sucesso', 'Login realizado com sucesso!');
  };

  const handleOAuthError = (error: string) => {
    setSocialLoading(null);
    setShowOAuthWebView(false);
    setOauthUrl(null);
    Alert.alert('Erro', error);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Atenção', 'Por favor, insira seu email.');
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = Platform.OS === 'web'
        ? (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '')
        : 'auricapri://reset-password';
      
      if (!redirectUrl) {
        Alert.alert('Erro', 'Redirect URL não configurada');
        setIsLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      
      setPasswordResetSent(true);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (user) return t('auth.myAccount');
    if (forgotPasswordMode) return 'Recuperar Senha';
    return authMode === 'login' ? t('auth.signIn') : t('auth.createAccount');
  };

  // Use responsive drawer width - smaller for mobile
  const drawerWidth = getDrawerWidth(95, 280, 400);

  return (
    <>
    <Drawer isOpen={isOpen} onClose={onClose} side="right" title={getTitle()} width={drawerWidth}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {user ? (
          <UserProfileView 
            user={user} 
            t={t} 
            locale={locale} 
            onUpdate={onLogin}
            onLogout={() => { onLogout(); onClose(); }}
          />
        ) : forgotPasswordMode ? (
          passwordResetSent ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Check size={40} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Email Enviado</Text>
              <Text style={styles.successMessage}>
                Enviamos um link de recuperação de senha para {email}. 
                Verifique sua caixa de entrada e siga as instruções.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setForgotPasswordMode(false);
                  setPasswordResetSent(false);
                  setEmail('');
                }}
                style={styles.backButton}
              >
                <ArrowLeft size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                onPress={() => {
                  setForgotPasswordMode(false);
                  setEmail('');
                }}
                style={styles.backLink}
              >
                <ArrowLeft size={12} color="#737373" />
              </TouchableOpacity>
              <Text style={styles.forgotPasswordTitle}>Recuperar Senha</Text>
              <Text style={styles.forgotPasswordMessage}>
                Digite seu email e enviaremos um link para redefinir sua senha.
              </Text>

              <View style={styles.form}>
                <Input
                  label="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="voce@exemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <Button
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Enviando...</Text>
                    </>
                  ) : (
                    <>
                      <Mail size={16} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Enviar Link de Recuperação</Text>
                    </>
                  )}
                </Button>
              </View>
            </View>
          )
        ) : (
          <View style={styles.authContainer}>
            {/* Checkout Context Indicator */}
            <View style={styles.contextCard}>
              <View style={styles.contextIcon}>
                <ShoppingBag size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.contextText}>
                Identifique-se para garantir a segurança da sua transação Auricapri.
              </Text>
            </View>

            {/* Social Auth Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                onPress={() => handleSocialLogin('google')}
                disabled={!!socialLoading}
                style={[styles.socialButton, socialLoading === 'google' && styles.socialButtonDisabled]}
              >
                {socialLoading === 'google' ? (
                  <Loader2 size={16} color="#000000" />
                ) : (
                  <Text style={styles.googleIcon}>G</Text>
                )}
                <Text style={styles.socialButtonText}>Google Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleSocialLogin('apple')}
                disabled={!!socialLoading}
                style={[styles.socialButton, styles.socialButtonApple, socialLoading === 'apple' && styles.socialButtonDisabled]}
              >
                {socialLoading === 'apple' ? (
                  <Loader2 size={16} color="#000000" />
                ) : (
                  <Apple size={16} color="#000000" />
                )}
                <Text style={styles.socialButtonText}>Apple Login</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.form}>
              {authMode === 'register' && (
                <Input
                  label="Nome Completo"
                  value={fullName}
                  onChangeText={setFullName}
                />
              )}
              
              <Input
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                placeholder="voce@exemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <View>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.label}>{t('auth.password')}</Text>
                  {authMode === 'login' && (
                    <TouchableOpacity
                      onPress={() => setForgotPasswordMode(true)}
                    >
                      <Text style={styles.forgotPasswordLink}>Esqueceu a senha?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
                />
              </View>
              
              <Button
                onPress={handleAuth}
                disabled={isLoading || !!socialLoading}
                variant="primary"
                size="md"
                isLoading={isLoading}
              >
                {authMode === 'login' ? t('auth.login') : t('auth.signup')}
              </Button>
            </View>
            
            <View style={styles.switchAuth}>
              <Text style={styles.switchAuthText}>
                {authMode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
              </Text>
              <TouchableOpacity
                onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                <Text style={styles.switchAuthLink}>
                  {authMode === 'login' ? t('auth.signup') : t('auth.login')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </Drawer>
    
    {/* OAuth WebView for in-app authentication */}
    {Platform.OS !== 'web' && (
      <OAuthWebView
        visible={showOAuthWebView}
        url={oauthUrl || ''}
        redirectUrl="auricapri://auth"
        onClose={() => {
          setShowOAuthWebView(false);
          setOauthUrl(null);
          setSocialLoading(null);
        }}
        onSuccess={handleOAuthSuccess}
        onError={handleOAuthError}
      />
    )}
  </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: rp(20),
    minHeight: 300,
  },
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#ECFDF5',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: scaleFont(20, 0.5),
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(20, 0.5) * 0.1,
    marginBottom: rp(12),
  },
  successMessage: {
    fontSize: scaleFont(12, 0.3),
    color: '#737373',
    textAlign: 'center',
    lineHeight: scaleFont(12, 0.3) * 1.6,
    marginBottom: rp(24),
    paddingHorizontal: rp(8),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
  },
  backButtonText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: '#FFFFFF',
  },
  forgotPasswordContainer: {
    padding: rp(20),
    gap: rp(16),
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backLinkText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  forgotPasswordTitle: {
    fontSize: scaleFont(18, 0.4),
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(18, 0.4) * 0.11,
    marginBottom: rp(6),
  },
  forgotPasswordMessage: {
    fontSize: scaleFont(12, 0.3),
    color: '#737373',
    lineHeight: scaleFont(12, 0.3) * 1.6,
    marginBottom: rp(16),
  },
  form: {
    gap: 24,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  authContainer: {
    padding: rp(20),
    gap: rp(20),
  },
  contextCard: {
    backgroundColor: '#FAFAFA',
    padding: rp(16),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: rp(12),
  },
  contextIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#000000',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextText: {
    flex: 1,
    fontSize: scaleFont(9, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(9, 0.3) * 0.22,
    color: '#404040',
    lineHeight: scaleFont(9, 0.3) * 1.6,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rp(12),
    paddingVertical: rp(12),
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  socialButtonApple: {
    backgroundColor: '#FAFAFA',
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  socialButtonText: {
    fontSize: scaleFont(9, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(9, 0.3) * 0.22,
    color: '#000000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  dividerText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 6.4,
    color: '#A3A3A3',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  forgotPasswordLink: {
    fontSize: 9,
    fontWeight: '700',
    color: '#737373',
    textDecorationLine: 'underline',
  },
  input: {
    width: '100%',
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 16,
    fontSize: 14,
    color: '#000000',
  },
  switchAuth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
  },
  switchAuthText: {
    fontSize: 12,
    color: '#737373',
  },
  switchAuthLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    textDecorationLine: 'underline',
  },
});

export default AuthDrawer;
