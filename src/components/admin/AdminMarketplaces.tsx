/**
 * AdminMarketplaces - Orchestrator for marketplace management
 *
 * This is a lean orchestrator that composes:
 * - Types from ./marketplace/types
 * - Hooks from ./marketplace/hooks
 * - Modals from ./marketplace/modals
 * - Tabs from ./marketplace/tabs
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, Check, X, AlertCircle, Loader2,
  ChevronRight, RefreshCw, Package, ShoppingCart,
  MessageCircle, BarChart3, Settings, ArrowDownRight
} from 'lucide-react';
import { marketplaceApi } from '../../api/marketplace.api';
import type { MarketplaceConfig } from '../../types/marketplace';
import { logger } from '../../utils/logger';

// Import from marketplace submodules
import {
  MARKETPLACE_BRANDS,
  type MarketplaceBrand,
  type MarketplaceId,
} from './marketplace/types';

import {
  ImportProductModal,
  ImportFromMarketplaceModal,
  ConnectModal,
} from './marketplace/modals';

import {
  ProductsTab,
  OrdersTab,
  QuestionsTab,
  MetricsTab,
  SettingsTab,
} from './marketplace/tabs';

// ============================================================================
// Types
// ============================================================================

interface AdminMarketplacesProps {
  locale: string;
}

type ViewState = 'grid' | 'marketplace';

interface Provider {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

const AdminMarketplaces: React.FC<AdminMarketplacesProps> = ({ locale }) => {
  const [view, setView] = useState<ViewState>('grid');
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceId | null>(null);
  const [configs, setConfigs] = useState<MarketplaceConfig[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  });

  // Detect OAuth redirect and show feedback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth');
    const errorMessage = params.get('message');

    if (oauthStatus === 'success') {
      setToast({ message: 'Marketplace conectado com sucesso!', type: 'success', visible: true });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthStatus === 'error') {
      setToast({ message: `Erro ao conectar: ${decodeURIComponent(errorMessage || 'Erro desconhecido')}`, type: 'error', visible: true });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configsData, providersData] = await Promise.all([
        marketplaceApi.getConfigs(),
        marketplaceApi.getProviders(),
      ]);
      setConfigs(configsData);
      setProviders(providersData);
    } catch (err) {
      logger.error('Failed to load marketplace data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      const data = await marketplaceApi.getConfigs();
      setConfigs(data);
    } catch (err) {
      logger.error('Failed to load marketplace configs', err);
    }
  };

  // Helper to find provider by brand code
  const getProviderByCode = (code: string) => providers.find(p => p.code === code);

  // Helper to find config for a brand
  const getConfigForBrand = (brandKey: string) => {
    const brand = MARKETPLACE_BRANDS[brandKey as MarketplaceId];
    if (!brand) return undefined;
    const provider = getProviderByCode(brand.id);
    if (!provider) return undefined;
    return configs.find(c => c.provider_id === provider.id);
  };

  // Helper to get provider for a brand
  const getProviderForBrand = (brandKey: string) => {
    const brand = MARKETPLACE_BRANDS[brandKey as MarketplaceId];
    if (!brand) return undefined;
    return getProviderByCode(brand.id);
  };

  const handleSelectMarketplace = (id: MarketplaceId) => {
    setSelectedMarketplace(id);
    setView('marketplace');
  };

  const handleBack = () => {
    setView('grid');
    setSelectedMarketplace(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (view === 'marketplace' && selectedMarketplace) {
    const brand = MARKETPLACE_BRANDS[selectedMarketplace];
    const provider = getProviderForBrand(selectedMarketplace);
    const config = getConfigForBrand(selectedMarketplace);

    if (!brand) {
      setView('grid');
      setSelectedMarketplace(null);
      return null;
    }

    return (
      <MarketplaceView
        brand={brand}
        config={config}
        providerId={provider?.id}
        locale={locale}
        onBack={handleBack}
        onConfigUpdate={loadConfigs}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Marketplaces</h1>
        <p className="text-neutral-500 text-sm">
          Conecte e gerencie suas vendas nos principais marketplaces
        </p>
      </div>

      {/* Marketplace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(MARKETPLACE_BRANDS).map(([brandKey, brand]) => {
          const config = getConfigForBrand(brandKey);
          const isConnected = config?.status === 'connected';

          return (
            <div
              key={brandKey}
              onClick={() => brand.available && handleSelectMarketplace(brandKey as MarketplaceId)}
              className={`
                relative overflow-hidden rounded-2xl border-2 transition-all duration-300
                ${brand.available
                  ? `cursor-pointer hover:shadow-xl hover:scale-[1.02] ${brand.borderColor}`
                  : 'opacity-60 cursor-not-allowed border-neutral-200'
                }
              `}
            >
              {/* Brand Header */}
              <div className={`bg-gradient-to-r ${brand.bgGradient} p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${brand.textColor}`}>{brand.name}</h3>
                      <p className={`text-sm ${brand.textColor} opacity-80`}>{brand.description}</p>
                    </div>
                  </div>
                  {isConnected && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className={`text-xs font-bold ${brand.textColor} flex items-center gap-1`}>
                        <Check className="w-3 h-3" /> Conectado
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white p-6">
                {brand.available ? (
                  isConnected ? (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">Produtos</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">Vendas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">R$ 0</div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">Faturado</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-neutral-500 text-sm mb-3">
                        Conecte sua conta para começar a vender
                      </p>
                      <button
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${brand.bgColor} ${brand.textColor}`}
                      >
                        <Plus className="w-4 h-4" />
                        Conectar Conta
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-4">
                    <span className="inline-block px-3 py-1 bg-neutral-100 text-neutral-500 text-xs font-medium rounded-full">
                      Em breve
                    </span>
                  </div>
                )}
              </div>

              {/* Arrow indicator */}
              {brand.available && (
                <div className="absolute bottom-6 right-6">
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* OAuth Toast Notification */}
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast({ ...toast, visible: false })}
            className="ml-2 hover:opacity-80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MarketplaceView Component
// ============================================================================

interface MarketplaceViewProps {
  brand: MarketplaceBrand;
  config?: MarketplaceConfig;
  providerId?: string;
  locale: string;
  onBack: () => void;
  onConfigUpdate: () => void;
}

type MarketplaceTab = 'products' | 'orders' | 'questions' | 'metrics' | 'settings';

const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  brand,
  config,
  providerId,
  locale,
  onBack,
  onConfigUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('products');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportFromMLModal, setShowImportFromMLModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(!config || config.status !== 'connected');

  const isConnected = config?.status === 'connected';

  const tabs: { id: MarketplaceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'products', label: 'Produtos', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: 'Pedidos', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'questions', label: 'Perguntas', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'metrics', label: 'Métricas', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen -m-6 -mt-6">
      {/* Brand Header */}
      <div className={`bg-gradient-to-r ${brand.bgGradient} px-6 py-4`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className={`p-2 rounded-lg bg-white/20 backdrop-blur-sm ${brand.textColor} hover:bg-white/30 transition-colors`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5">
                  <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${brand.textColor}`}>{brand.name}</h1>
                  <p className={`text-xs ${brand.textColor} opacity-80`}>
                    {isConnected ? 'Conta conectada' : 'Não conectado'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isConnected && (
                <>
                  <button
                    onClick={() => setShowImportFromMLModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                    style={{ color: 'white' }}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    Importar do {brand.shortName}
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
                    style={{ color: brand.accentColor }}
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Produto
                  </button>
                  <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                    <RefreshCw className={`w-5 h-5 ${brand.textColor}`} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          {isConnected && (
            <div className="flex gap-1 mt-4 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white shadow-sm'
                      : `${brand.textColor} bg-white/20 backdrop-blur-sm hover:bg-white/30`
                  }`}
                  style={activeTab === tab.id ? { color: brand.accentColor } : {}}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {!isConnected ? (
          <ConnectAccountCard brand={brand} onConnect={() => setShowConnectModal(true)} />
        ) : (
          <>
            {activeTab === 'products' && (
              <ProductsTab
                brand={brand}
                configId={config?.id}
                locale={locale}
                onImport={() => setShowImportModal(true)}
              />
            )}
            {activeTab === 'orders' && <OrdersTab brand={brand} configId={config?.id} locale={locale} />}
            {activeTab === 'questions' && <QuestionsTab brand={brand} configId={config?.id} />}
            {activeTab === 'metrics' && <MetricsTab brand={brand} configId={config?.id} locale={locale} />}
            {activeTab === 'settings' && <SettingsTab brand={brand} config={config} onUpdate={onConfigUpdate} />}
          </>
        )}
      </div>

      {/* Modals */}
      {showImportModal && (
        <ImportProductModal
          brand={brand}
          configId={config?.id}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
          }}
        />
      )}

      {showImportFromMLModal && (
        <ImportFromMarketplaceModal
          brand={brand}
          configId={config?.id}
          onClose={() => setShowImportFromMLModal(false)}
          onSuccess={() => {
            setShowImportFromMLModal(false);
            onConfigUpdate();
          }}
        />
      )}

      {showConnectModal && !isConnected && (
        <ConnectModal
          brand={brand}
          providerId={providerId}
          onClose={() => {
            setShowConnectModal(false);
            onBack();
          }}
          onSuccess={() => {
            setShowConnectModal(false);
            onConfigUpdate();
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// ConnectAccountCard Component
// ============================================================================

const ConnectAccountCard: React.FC<{
  brand: MarketplaceBrand;
  onConnect: () => void;
}> = ({ brand, onConnect }) => (
  <div className="max-w-lg mx-auto text-center py-12">
    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${brand.bgGradient} flex items-center justify-center`}>
      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2">
        <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
      </div>
    </div>
    <h2 className="text-2xl font-bold mb-2">Conecte sua conta do {brand.name}</h2>
    <p className="text-neutral-500 mb-6">
      Vincule sua conta para começar a gerenciar seus produtos e vendas diretamente daqui.
    </p>
    <button
      onClick={onConnect}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
    >
      <Plus className="w-5 h-5" />
      Conectar {brand.name}
    </button>
  </div>
);

export default AdminMarketplaces;
