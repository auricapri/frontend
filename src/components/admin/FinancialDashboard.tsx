import React, { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, TrendingUp, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { PaymentsApi } from '../../api/payments.api';
import { marketplaceApi } from '../../api/marketplace.api';

interface Balance {
  provider: string;
  balance: number;
  pending: number;
  total: number;
  currency: string;
  lastUpdate: string;
}

interface PlatformCardProps {
  name: string;
  provider: string;
  balance: Balance | null;
  loading: boolean;
  error: string | null;
  needsReauth: boolean;
  onReconnect?: () => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({
  name,
  provider,
  balance,
  loading,
  error,
  needsReauth,
  onReconnect
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'asaas':
        return 'from-blue-500 to-blue-600';
      case 'mercado_livre':
        return 'from-yellow-400 to-yellow-500';
      case 'tiktok_shop':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
          <AlertCircle className="text-red-500" size={24} />
        </div>
        <p className="text-sm text-red-600 mb-4">{error}</p>

        {needsReauth && onReconnect && (
          <button
            onClick={onReconnect}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
          >
            <LinkIcon size={16} />
            Reconectar
          </button>
        )}
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
          <AlertCircle className="text-gray-400" size={24} />
        </div>
        <p className="text-sm text-gray-500">Não conectado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className={`bg-gradient-to-r ${getProviderColor(provider)} p-4`}>
        <h3 className="text-lg font-semibold text-white">{name}</h3>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Saldo Disponível</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(balance.balance)}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Saldo Pendente</p>
          <p className="text-lg font-semibold text-gray-700">
            {formatCurrency(balance.pending)}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(balance.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FinancialDashboard: React.FC = () => {
  const paymentsApi = new PaymentsApi();

  const [asaasBalance, setAsaasBalance] = useState<Balance | null>(null);
  const [mlBalance, setMlBalance] = useState<Balance | null>(null);
  const [ttBalance, setTtBalance] = useState<Balance | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [errors, setErrors] = useState<{
    asaas: string | null;
    ml: string | null;
    tt: string | null;
  }>({
    asaas: null,
    ml: null,
    tt: null
  });

  const [needsReauth, setNeedsReauth] = useState<{
    ml: boolean;
    tt: boolean;
  }>({
    ml: false,
    tt: false
  });

  const isOAuthError = (error: any): boolean => {
    const errorMsg = error?.message || '';
    return (
      errorMsg.includes('403') ||
      errorMsg.includes('Forbidden') ||
      errorMsg.includes('500') ||
      errorMsg.includes('Internal Server Error') ||
      errorMsg.includes('unauthorized') ||
      errorMsg.includes('Token')
    );
  };

  const fetchAllBalances = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const newErrors = { asaas: null, ml: null, tt: null };
    const newReauth = { ml: false, tt: false };

    // Fetch Asaas balance
    try {
      const asaas = await paymentsApi.getBalance();
      setAsaasBalance({
        provider: asaas.provider,
        balance: asaas.balance,
        pending: asaas.pendingBalance,
        total: asaas.totalBalance,
        currency: asaas.currency,
        lastUpdate: asaas.lastUpdate
      });
    } catch (error: any) {
      console.error('Erro ao buscar saldo Asaas:', error);
      newErrors.asaas = error.message || 'Erro ao carregar saldo';
    }

    // Fetch Mercado Livre balance
    try {
      const ml = await marketplaceApi.getMercadoLivreBalance();
      setMlBalance(ml);
    } catch (error: any) {
      console.error('Erro ao buscar saldo Mercado Livre:', error);

      if (isOAuthError(error)) {
        newErrors.ml = 'Token de acesso expirado. Clique em "Reconectar" para autenticar novamente.';
        newReauth.ml = true;
      } else {
        newErrors.ml = error.message || 'Não conectado ou erro ao carregar';
      }
    }

    // Fetch TikTok Shop balance
    try {
      const tt = await marketplaceApi.getTikTokShopBalance();
      setTtBalance(tt);
    } catch (error: any) {
      console.error('Erro ao buscar saldo TikTok Shop:', error);

      if (isOAuthError(error)) {
        newErrors.tt = 'Token de acesso expirado. Clique em "Reconectar" para autenticar novamente.';
        newReauth.tt = true;
      } else {
        newErrors.tt = error.message || 'Não conectado ou erro ao carregar';
      }
    }

    setErrors(newErrors);
    setNeedsReauth(newReauth);
    setLastUpdate(new Date());
    setLoading(false);
    setRefreshing(false);
  };

  const handleReconnect = async (marketplace: 'mercado_livre' | 'tiktok_shop') => {
    try {
      // Get marketplace config from backend by provider code
      const config = await marketplaceApi.getConfigByProviderCode(marketplace);
      if (!config) {
        throw new Error(`Configuração do marketplace ${marketplace} não encontrada. Configure primeiro em Admin > Marketplaces.`);
      }
      const configId = config.id;

      // Get current URL for redirect
      const redirectUri = `${window.location.origin}/admin/marketplace-callback`;

      // Generate PKCE code verifier and challenge (for enhanced security)
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store code verifier in session storage for later use in callback
      sessionStorage.setItem(`oauth_verifier_${marketplace}`, codeVerifier);
      sessionStorage.setItem(`oauth_marketplace`, marketplace);

      // Get OAuth authorization URL
      const { url } = await marketplaceApi.getAuthUrl(
        configId,
        redirectUri,
        codeChallenge,
        codeVerifier
      );

      // Open OAuth URL in popup window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        'oauth-popup',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          // Refresh balances after popup closes
          setTimeout(() => fetchAllBalances(true), 1000);
        }
      }, 500);
    } catch (error: any) {
      console.error(`Erro ao reconectar ${marketplace}:`, error);
      alert(`Erro ao iniciar reconexão: ${error.message}`);
    }
  };

  // Helper functions for PKCE
  const generateRandomString = (length: number): string => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  useEffect(() => {
    fetchAllBalances();

    // Auto-refresh a cada 5 minutos
    const interval = setInterval(() => {
      fetchAllBalances(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTotalAvailable = () => {
    let total = 0;
    if (asaasBalance) total += asaasBalance.balance;
    if (mlBalance) total += mlBalance.balance;
    if (ttBalance) total += ttBalance.balance;
    return total;
  };

  const getTotalPending = () => {
    let total = 0;
    if (asaasBalance) total += asaasBalance.pending;
    if (mlBalance) total += mlBalance.pending;
    if (ttBalance) total += ttBalance.pending;
    return total;
  };

  const getTotalGeneral = () => {
    return getTotalAvailable() + getTotalPending();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Financeiro</h1>
            <p className="text-gray-600">Visualize o saldo consolidado de todas as plataformas</p>
          </div>

          <button
            onClick={() => fetchAllBalances(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={20} />
            {refreshing ? 'Atualizando...' : 'Atualizar Agora'}
          </button>
        </div>

        {lastUpdate && (
          <p className="text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleString('pt-BR')}
          </p>
        )}
      </div>

      {/* Resumo Total */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Saldo Disponível</h3>
            <DollarSign size={32} />
          </div>
          <p className="text-3xl font-bold">
            {formatCurrency(getTotalAvailable())}
          </p>
          <p className="text-sm mt-2 opacity-90">Disponível para saque</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Saldo Pendente</h3>
            <TrendingUp size={32} />
          </div>
          <p className="text-3xl font-bold">
            {formatCurrency(getTotalPending())}
          </p>
          <p className="text-sm mt-2 opacity-90">Em processamento</p>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Total Geral</h3>
            <DollarSign size={32} />
          </div>
          <p className="text-3xl font-bold">
            {formatCurrency(getTotalGeneral())}
          </p>
          <p className="text-sm mt-2 opacity-90">Todas as plataformas</p>
        </div>
      </div>

      {/* Cards por Plataforma */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Saldo por Plataforma</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlatformCard
            name="Asaas"
            provider="asaas"
            balance={asaasBalance}
            loading={loading}
            error={errors.asaas}
            needsReauth={false}
          />
          <PlatformCard
            name="Mercado Livre"
            provider="mercado_livre"
            balance={mlBalance}
            loading={loading}
            error={errors.ml}
            needsReauth={needsReauth.ml}
            onReconnect={() => handleReconnect('mercado_livre')}
          />
          <PlatformCard
            name="TikTok Shop"
            provider="tiktok_shop"
            balance={ttBalance}
            loading={loading}
            error={errors.tt}
            needsReauth={needsReauth.tt}
            onReconnect={() => handleReconnect('tiktok_shop')}
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Os saldos são atualizados automaticamente a cada 5 minutos.
          Você também pode atualizar manualmente clicando no botão "Atualizar Agora".
        </p>
      </div>
    </div>
  );
};

export default FinancialDashboard;
