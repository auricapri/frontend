import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { marketplaceApi } from '../api/marketplace.api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export const MarketplaceOAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando autenticação...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('Código de autorização não encontrado');
        }

        // Get marketplace and code verifier from session storage
        const marketplace = sessionStorage.getItem('oauth_marketplace');
        const codeVerifier = sessionStorage.getItem(`oauth_verifier_${marketplace}`);

        if (!marketplace) {
          throw new Error('Informações de marketplace não encontradas');
        }

        // Get config ID based on marketplace
        const configId = marketplace === 'mercado_livre' ? 'mercado-livre-default' : 'tiktok-shop-default';
        const redirectUri = `${window.location.origin}/admin/marketplace-callback`;

        // Exchange code for access token
        const result = await marketplaceApi.handleOAuthCallback(
          configId,
          code,
          redirectUri
        );

        // Clean up session storage
        sessionStorage.removeItem(`oauth_verifier_${marketplace}`);
        sessionStorage.removeItem('oauth_marketplace');

        setStatus('success');
        setMessage(result.message || 'Autenticação concluída com sucesso!');

        // Close popup after 2 seconds or redirect if not in popup
        setTimeout(() => {
          if (window.opener) {
            // If in popup, close it
            window.close();
          } else {
            // If not in popup, redirect to financial dashboard
            navigate('/admin/financial');
          }
        }, 2000);
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Erro ao processar autenticação');

        // Clean up session storage even on error
        const marketplace = sessionStorage.getItem('oauth_marketplace');
        if (marketplace) {
          sessionStorage.removeItem(`oauth_verifier_${marketplace}`);
          sessionStorage.removeItem('oauth_marketplace');
        }

        // Close popup or redirect after 3 seconds
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/admin/financial');
          }
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processando</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sucesso!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Fechando em alguns segundos...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Fechando em alguns segundos...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MarketplaceOAuthCallback;
