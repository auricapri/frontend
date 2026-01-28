/**
 * ConnectModal - OAuth credential form and connection flow
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { marketplaceApi, type MarketplaceProvider } from '../../../../api/marketplace.api';
import { logger } from '../../../../utils/logger';
import { generateCodeVerifier, generateCodeChallenge } from '../hooks/useMarketplaceAuth';
import type { MarketplaceBrand } from '../types';

// ============================================================================
// Component Props
// ============================================================================

export interface ConnectModalProps {
  brand: MarketplaceBrand;
  providerId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const ConnectModal: React.FC<ConnectModalProps> = ({
  brand,
  providerId,
  onClose,
  onSuccess,
}) => {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [provider, setProvider] = useState<MarketplaceProvider | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load provider details to get required fields
  useEffect(() => {
    const loadProvider = async () => {
      if (!providerId) return;
      try {
        const providerData = await marketplaceApi.getProvider(providerId);
        setProvider(providerData);

        // Initialize credentials with empty values for all required fields
        const initialCredentials: Record<string, string> = {};
        providerData.required_fields.fields.forEach((field) => {
          initialCredentials[field.key] = '';
        });
        setCredentials(initialCredentials);
      } catch (err) {
        logger.error('Failed to load provider', err);
        setError('Falha ao carregar informações do provider.');
      }
    };
    loadProvider();
  }, [providerId]);

  const handleSave = async () => {
    if (!providerId) {
      setError('Provider não encontrado. Por favor, tente novamente mais tarde.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Create config with the actual provider UUID
      const config = await marketplaceApi.createConfig({
        provider_id: providerId,
        credentials: credentials,
        environment: 'production',
        auto_sync_stock: false, // Stock only on site
        auto_sync_price: true,
        sync_interval_minutes: 30,
      });

      // Generate PKCE code_verifier and code_challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Get OAuth URL and redirect
      // Remove /api do final se existir, pois o endpoint já inclui /api
      let backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      if (backendUrl.endsWith('/api')) {
        backendUrl = backendUrl.slice(0, -4);
      }
      const redirectUri = `${backendUrl}/api/marketplace/oauth/callback`;

      // Pass PKCE params to backend
      const { url } = await marketplaceApi.getAuthUrl(
        config.id,
        redirectUri,
        codeChallenge,
        codeVerifier
      );

      window.location.href = url;
    } catch (err) {
      logger.error('Failed to connect', err);
      setError('Falha ao conectar. Por favor, verifique suas credenciais.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${brand.bgGradient}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2">
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${brand.textColor}`}>
                Conectar {brand.name}
              </h2>
              <p className={`text-sm ${brand.textColor} opacity-80`}>
                Configure suas credenciais
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {!provider ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : (
            <>
              {provider.required_fields.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type === 'password' ? 'password' : 'text'}
                    value={credentials[field.key] || ''}
                    onChange={(e) =>
                      setCredentials({ ...credentials, [field.key]: e.target.value })
                    }
                    placeholder={field.help || field.label}
                    className="w-full px-4 py-3 border rounded-xl"
                    required={field.required}
                  />
                  {field.help && (
                    <p className="text-xs text-neutral-500 mt-1">{field.help}</p>
                  )}
                </div>
              ))}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                  Após salvar, você será redirecionado para o {brand.name} para autorizar o
                  acesso.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border rounded-xl hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={
              isSaving ||
              !provider ||
              provider.required_fields.fields.some(
                (field) => field.required && !credentials[field.key]?.trim()
              )
            }
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium ${brand.bgColor} ${brand.textColor} disabled:opacity-50`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Conectar
          </button>
        </div>
      </div>
    </div>
  );
};
