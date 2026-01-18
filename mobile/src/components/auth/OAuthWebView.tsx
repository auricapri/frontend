/**
 * OAuth WebView Component
 * Handles OAuth authentication within the app using WebView
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from '../ui/Icons';
import { supabase } from '../../utils/supabase';

interface OAuthWebViewProps {
  visible: boolean;
  url: string;
  redirectUrl: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const OAuthWebView: React.FC<OAuthWebViewProps> = ({
  visible,
  url,
  redirectUrl,
  onClose,
  onSuccess,
  onError,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;
    
    if (!currentUrl) return;
    
    console.log('OAuth WebView navigation:', currentUrl);
    
    // Check if URL contains OAuth callback parameters (access_token or error)
    // Supabase redirects to the redirectUrl with hash parameters
    const hasAccessToken = currentUrl.includes('access_token=') || currentUrl.includes('#access_token') || currentUrl.includes('access_token=');
    const hasError = currentUrl.includes('error=') || currentUrl.includes('#error');
    const isRedirectUrl = currentUrl.includes(redirectUrl.replace('auricapri://', '')) || 
                         currentUrl.includes('supabase.co/auth/v1/callback') ||
                         currentUrl.startsWith('auricapri://');
    
    if (hasAccessToken || hasError || isRedirectUrl) {
      console.log('OAuth callback detected, parsing...');
      
      // Parse the URL to extract tokens
      const hashIndex = currentUrl.indexOf('#');
      const queryIndex = currentUrl.indexOf('?');
      
      // Get hash or query string
      let paramsString = '';
      if (hashIndex >= 0) {
        paramsString = currentUrl.substring(hashIndex + 1);
      } else if (queryIndex >= 0) {
        paramsString = currentUrl.substring(queryIndex + 1);
      }
      
      // Parse parameters
      const params: Record<string, string> = {};
      if (paramsString) {
        paramsString.split('&').forEach((param) => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        });
      }
      
      const accessToken = params['access_token'];
      const refreshToken = params['refresh_token'];
      const error = params['error'];
      const errorDescription = params['error_description'];
      
      console.log('OAuth params:', { hasAccessToken: !!accessToken, hasError: !!error });
      
      if (error) {
        console.error('OAuth error:', error, errorDescription);
        onError(errorDescription || error);
        onClose();
        return;
      }
      
      if (accessToken && refreshToken) {
        console.log('Setting session with tokens...');
        // Set session manually
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ data, error: sessionError }) => {
          if (sessionError) {
            console.error('Session error:', sessionError);
            onError(sessionError.message);
            onClose();
            return;
          }
          
          if (data?.session) {
            console.log('Session set successfully');
            onSuccess();
            onClose();
          } else {
            console.warn('Session set but no session data');
            onError('Sessão não criada');
            onClose();
          }
        }).catch((err: any) => {
          console.error('Session catch error:', err);
          onError(err.message || 'Erro ao processar autenticação');
          onClose();
        });
      } else if (hasAccessToken || isRedirectUrl) {
        // If we're on the redirect URL but don't have tokens yet, wait a bit
        // Sometimes the URL changes before the hash is fully loaded
        console.log('Waiting for tokens...');
      }
    }
  };

  if (!visible || !url) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Login com Google</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#000000" />
          </TouchableOpacity>
        </View>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        )}
        
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onShouldStartLoadWithRequest={(request) => {
            const { url: requestUrl } = request;
            
            // Check if this is the OAuth callback
            if (requestUrl && (requestUrl.includes('access_token=') || requestUrl.includes('#access_token') || requestUrl.includes('error='))) {
              handleNavigationStateChange({ url: requestUrl });
              return false; // Prevent navigation, we'll handle it manually
            }
            
            // Allow navigation to redirect URL (deep link will be handled by app)
            if (requestUrl && requestUrl.includes(redirectUrl.replace('auricapri://', ''))) {
              handleNavigationStateChange({ url: requestUrl });
              return false; // Prevent navigation to deep link
            }
            
            return true; // Allow normal navigation
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            onError('Erro ao carregar página de autenticação');
            onClose();
          }}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
  },
});

export default OAuthWebView;

