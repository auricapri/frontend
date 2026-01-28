/**
 * useMarketplaceAuth - OAuth/PKCE authentication flow for marketplaces
 */

import { useCallback, useEffect, useState } from 'react';
import { marketplaceApi } from '../../../../api/marketplace.api';
import type { MarketplaceConfig } from '../../../../types/marketplace';
import type { Provider, ToastState } from '../types';

// ============================================================================
// PKCE (Proof Key for Code Exchange) utilities
// ============================================================================

export function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  for (let i = 0; i < 64; i++) {
    verifier += chars[array[i] % chars.length];
  }
  return verifier;
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  // Base64URL encode (without padding)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseMarketplaceAuthParams {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface UseMarketplaceAuthReturn {
  // State
  isConnecting: boolean;

  // Actions
  initiateOAuth: (providerId: string) => Promise<void>;
  disconnectMarketplace: (configId: string) => Promise<void>;

  // OAuth redirect detection
  handleOAuthRedirect: () => { status: 'success' | 'error' | null; message?: string };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMarketplaceAuth(params: UseMarketplaceAuthParams = {}): UseMarketplaceAuthReturn {
  const { onSuccess, onError } = params;
  const [isConnecting, setIsConnecting] = useState(false);

  // Initiate OAuth flow with PKCE
  const initiateOAuth = useCallback(async (providerId: string) => {
    setIsConnecting(true);
    try {
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store verifier in sessionStorage for callback
      sessionStorage.setItem(`pkce_verifier_${providerId}`, codeVerifier);

      // Get OAuth URL from backend
      const { authorization_url } = await marketplaceApi.initiateOAuth(providerId, {
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      // Redirect to marketplace OAuth page
      window.location.href = authorization_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar autenticação';
      onError?.(message);
    } finally {
      setIsConnecting(false);
    }
  }, [onError]);

  // Disconnect marketplace
  const disconnectMarketplace = useCallback(async (configId: string) => {
    try {
      await marketplaceApi.deleteConfig(configId);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao desconectar marketplace';
      onError?.(message);
      throw err;
    }
  }, [onSuccess, onError]);

  // Handle OAuth redirect
  const handleOAuthRedirect = useCallback((): { status: 'success' | 'error' | null; message?: string } => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth');
    const errorMessage = params.get('message');

    if (oauthStatus === 'success') {
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
      return { status: 'success', message: 'Marketplace conectado com sucesso!' };
    } else if (oauthStatus === 'error') {
      window.history.replaceState({}, '', window.location.pathname);
      return {
        status: 'error',
        message: `Erro ao conectar: ${decodeURIComponent(errorMessage || 'Erro desconhecido')}`
      };
    }

    return { status: null };
  }, []);

  return {
    isConnecting,
    initiateOAuth,
    disconnectMarketplace,
    handleOAuthRedirect,
  };
}
