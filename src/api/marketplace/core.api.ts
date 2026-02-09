/**
 * Marketplace Core API - Providers, Configs, and OAuth
 */
import { apiClient } from '../client';
import type {
  MarketplaceProvider,
  MarketplaceConfig,
  MarketplaceConfigInput,
  MarketplaceConfigUpdate,
} from './types';

const BASE_PATH = '/marketplace';

// ============================================
// PROVIDERS
// ============================================

/**
 * Get all active marketplace providers.
 */
export async function getProviders(): Promise<MarketplaceProvider[]> {
  return apiClient.get<MarketplaceProvider[]>(`${BASE_PATH}/providers`);
}

/**
 * Get a provider by ID.
 */
export async function getProvider(id: string): Promise<MarketplaceProvider> {
  return apiClient.get<MarketplaceProvider>(`${BASE_PATH}/providers/${id}`);
}

// ============================================
// CONFIGS
// ============================================

/**
 * Get all marketplace configurations.
 */
export async function getConfigs(): Promise<MarketplaceConfig[]> {
  return apiClient.get<MarketplaceConfig[]>(`${BASE_PATH}/configs`);
}

/**
 * Get a config by ID.
 */
export async function getConfig(id: string): Promise<MarketplaceConfig> {
  return apiClient.get<MarketplaceConfig>(`${BASE_PATH}/configs/${id}`);
}

/**
 * Create a new marketplace configuration.
 */
export async function createConfig(input: MarketplaceConfigInput): Promise<MarketplaceConfig> {
  return apiClient.post<MarketplaceConfig>(`${BASE_PATH}/configs`, input);
}

/**
 * Update a marketplace configuration.
 */
export async function updateConfig(id: string, input: MarketplaceConfigUpdate): Promise<MarketplaceConfig> {
  return apiClient.put<MarketplaceConfig>(`${BASE_PATH}/configs/${id}`, input);
}

/**
 * Delete a marketplace configuration.
 */
export async function deleteConfig(id: string): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/configs/${id}`);
}

/**
 * Get a config by provider code.
 * @param providerCode - Provider code (mercado_livre, tiktok_shop)
 */
export async function getConfigByProviderCode(providerCode: string): Promise<MarketplaceConfig | null> {
  try {
    return await apiClient.get<MarketplaceConfig>(`${BASE_PATH}/configs/by-provider/${providerCode}`);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        return null;
      }
    }
    throw error;
  }
}

// ============================================
// OAUTH
// ============================================

/**
 * Get OAuth authorization URL for a config.
 * @param configId - The config ID
 * @param redirectUri - The redirect URI for OAuth callback
 * @param codeChallenge - PKCE code_challenge (SHA256 hash of code_verifier, base64url encoded)
 * @param codeVerifier - PKCE code_verifier (will be stored in state for token exchange)
 */
export async function getAuthUrl(
  configId: string,
  redirectUri: string,
  codeChallenge?: string,
  codeVerifier?: string
): Promise<{ url: string }> {
  const params = new URLSearchParams({ redirect_uri: redirectUri });
  if (codeChallenge) params.set('code_challenge', codeChallenge);
  if (codeVerifier) params.set('code_verifier', codeVerifier);

  return apiClient.get<{ url: string }>(
    `${BASE_PATH}/configs/${configId}/auth-url?${params.toString()}`
  );
}

/**
 * Process OAuth callback.
 */
export async function handleOAuthCallback(
  configId: string,
  code: string,
  redirectUri: string
): Promise<{ status: string; message: string }> {
  return apiClient.post<{ status: string; message: string }>(
    `${BASE_PATH}/configs/${configId}/callback`,
    { code, redirect_uri: redirectUri }
  );
}

/**
 * Test connection for a config.
 */
export async function testConnection(configId: string): Promise<{ success: boolean; message?: string }> {
  return apiClient.post<{ success: boolean; message?: string }>(
    `${BASE_PATH}/configs/${configId}/test`
  );
}
