import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Plus, Search, Package, ShoppingCart, MessageCircle,
  BarChart3, Settings, RefreshCw, Check, X, AlertCircle, Loader2,
  ExternalLink, Upload, Image, Edit3, Trash2, Eye, TrendingUp,
  Star, Clock, Tag, ChevronRight, Filter, MoreVertical, Copy
} from 'lucide-react';
import { marketplaceApi } from '../../api/marketplace.api';
import { ProductsApi } from '../../api/products.api';
import type { MarketplaceConfig } from '../../types/marketplace';
import type { Product } from '../../types';
import { logger } from '../../utils/logger';
import { formatCurrency } from '../../utils/currency';
import { Locale } from '../../i18n';

const productsApi = new ProductsApi();

interface AdminMarketplacesProps {
  locale: string;
}

// Marketplace brand configurations
const MARKETPLACE_BRANDS = {
  'mercado-livre': {
    id: 'mercado_livre',
    name: 'Mercado Livre',
    shortName: 'ML',
    logo: 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo_large_25years@2x.png',
    bgGradient: 'from-yellow-400 to-yellow-500',
    bgColor: 'bg-yellow-400',
    textColor: 'text-yellow-900',
    accentColor: '#FFE600',
    hoverBg: 'hover:bg-yellow-50',
    borderColor: 'border-yellow-400',
    description: 'O maior marketplace da América Latina',
    available: true,
  },
  'shopee': {
    id: 'shopee',
    name: 'Shopee',
    shortName: 'SP',
    logo: 'https://cf.shopee.com.br/file/br-50009109-f6d79dbc4021a3eb57f61ffe2c1bfbda_xhdpi',
    bgGradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    accentColor: '#EE4D2D',
    hoverBg: 'hover:bg-orange-50',
    borderColor: 'border-orange-500',
    description: 'Compre e venda pelo celular',
    available: false,
  },
  'aliexpress': {
    id: 'aliexpress',
    name: 'AliExpress',
    shortName: 'AE',
    logo: 'https://ae01.alicdn.com/kf/S7aca51d4a3d54c1d89e1f50b6c1c1c1cT.png',
    bgGradient: 'from-red-600 to-red-700',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    accentColor: '#E62E04',
    hoverBg: 'hover:bg-red-50',
    borderColor: 'border-red-600',
    description: 'Global marketplace',
    available: false,
  },
  'temu': {
    id: 'temu',
    name: 'Temu',
    shortName: 'TM',
    logo: 'https://aimg.kwcdn.com/upload_aimg/temu/da515ef6-a498-4ef3-9823-e1e53a10be5b.png',
    bgGradient: 'from-orange-600 to-orange-700',
    bgColor: 'bg-orange-600',
    textColor: 'text-white',
    accentColor: '#FB7701',
    hoverBg: 'hover:bg-orange-50',
    borderColor: 'border-orange-600',
    description: 'Shop like a billionaire',
    available: false,
  },
  'alibaba': {
    id: 'alibaba',
    name: 'Alibaba',
    shortName: 'AB',
    logo: 'https://s.alicdn.com/@img/imgextra/i1/O1CN01AKUdEM1bz7VDjldnS_!!6000000003535-2-tps-160-64.png',
    bgGradient: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    accentColor: '#FF6A00',
    hoverBg: 'hover:bg-orange-50',
    borderColor: 'border-orange-500',
    description: 'Global B2B marketplace',
    available: false,
  },
  'tiktok-shop': {
    id: 'tiktok_shop',
    name: 'TikTok Shop',
    shortName: 'TT',
    logo: 'https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png',
    bgGradient: 'from-black to-gray-900',
    bgColor: 'bg-black',
    textColor: 'text-white',
    accentColor: '#FF0050',
    hoverBg: 'hover:bg-gray-50',
    borderColor: 'border-black',
    description: 'Venda direto no TikTok para milhoes de usuarios',
    available: true,
  },
};

type MarketplaceId = keyof typeof MARKETPLACE_BRANDS;
type ViewState = 'grid' | 'marketplace';

// Provider type from API
interface Provider {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
}

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
      // Clean URL params
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

  // Helper to find provider by brand code (uses brand.id which matches provider.code in database)
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

    // Safety check - return to grid if brand not found
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

// ============================================
// MARKETPLACE VIEW COMPONENT
// ============================================

interface MarketplaceViewProps {
  brand: typeof MARKETPLACE_BRANDS[MarketplaceId];
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
            // Refresh products
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

// ============================================
// CONNECT ACCOUNT CARD
// ============================================

const ConnectAccountCard: React.FC<{
  brand: typeof MARKETPLACE_BRANDS[MarketplaceId];
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

// ============================================
// PRODUCTS TAB
// ============================================

const ProductsTab: React.FC<{
  brand: typeof MARKETPLACE_BRANDS[MarketplaceId];
  configId?: string;
  locale: string;
  onImport: () => void;
}> = ({ brand, configId, locale, onImport }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    loadProducts();
  }, [configId]);

  const loadProducts = async () => {
    if (!configId) return;
    try {
      const mappings = await marketplaceApi.getMappings({ config_id: configId, limit: 100 });
      setProducts(mappings);
    } catch (err) {
      logger.error('Failed to load products', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-2xl flex items-center justify-center">
          <Package className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-bold mb-2">Nenhum produto ainda</h3>
        <p className="text-neutral-500 mb-6">
          Importe seus produtos do catálogo para começar a vender no {brand.name}
        </p>
        <button
          onClick={onImport}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
        >
          <Plus className="w-5 h-5" />
          Importar Produtos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 border rounded-xl hover:bg-neutral-50">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button
            onClick={onImport}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Products Grid - ML Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product: any) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => setSelectedProduct(product)}
          >
            {/* Image */}
            <div className="aspect-square bg-neutral-100 rounded-t-xl overflow-hidden relative">
              {product.product?.images?.[0] ? (
                <img
                  src={product.product.images[0]}
                  alt={product.product?.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-12 h-12 text-neutral-300" />
                </div>
              )}
              {/* Status badge */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                product.sync_status === 'synced'
                  ? 'bg-green-100 text-green-700'
                  : product.sync_status === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {product.sync_status === 'synced' ? 'Ativo' : product.sync_status === 'error' ? 'Erro' : 'Pendente'}
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h4 className="font-medium text-sm line-clamp-2 mb-2">
                {product.product?.name || 'Produto sem nome'}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: brand.accentColor }}>
                  {formatCurrency(product.marketplace_price || product.product?.price || 0, locale as Locale)}
                </span>
                <span className="text-xs text-neutral-500">
                  Estoque: {product.product?.stock || 0}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(product);
                }}
              >
                <Edit3 className="w-3 h-3" />
                Editar
              </button>
              <button
                className="flex items-center justify-center px-3 py-2 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (product.external_url) window.open(product.external_url, '_blank');
                }}
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Edit Modal */}
      {selectedProduct && (
        <ProductEditModal
          brand={brand}
          product={selectedProduct}
          locale={locale}
          onClose={() => setSelectedProduct(null)}
          onSave={async (data) => {
            // Save product changes
            setSelectedProduct(null);
            loadProducts();
          }}
        />
      )}
    </div>
  );
};

// ============================================
// ORDERS TAB
// ============================================

const OrdersTab: React.FC<{
  brand: typeof MARKETPLACE_BRANDS[MarketplaceId];
  configId?: string;
  locale: string;
}> = ({ brand, configId, locale }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [configId]);

  const loadOrders = async () => {
    if (!configId) return;
    try {
      const result = await marketplaceApi.getOrders(configId, { limit: 50 });
      setOrders(result.orders || []);
    } catch (err) {
      logger.error('Failed to load orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
        <h3 className="text-lg font-bold mb-2">Nenhum pedido ainda</h3>
        <p className="text-neutral-500">Os pedidos do {brand.name} aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Pedido</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Data</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Comprador</th>
            <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Total</th>
            <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((order: any) => (
            <tr key={order.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3 text-sm font-mono">#{order.id}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">
                {new Date(order.date_created).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US')}
              </td>
              <td className="px-4 py-3 text-sm">{order.buyer?.nickname || '-'}</td>
              <td className="px-4 py-3 text-sm text-right font-medium">
                {formatCurrency(order.total_amount, locale as Locale)}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'paid' ? 'bg-green-100 text-green-700' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// QUESTIONS TAB
// ============================================

const QuestionsTab: React.FC<{
  brand: typeof MARKETPLACE_BRANDS[MarketplaceId];
  configId?: string;
}> = ({ brand, configId }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [configId]);

  const loadQuestions = async () => {
    if (!configId) return;
    try {
      const result = await marketplaceApi.getQuestions(configId, { limit: 50 });
      setQuestions(result.questions || []);
    } catch (err) {
      logger.error('Failed to load questions', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (questionId: number) => {
    if (!configId || !answerText.trim()) return;
    try {
      await marketplaceApi.answerQuestion(configId, String(questionId), answerText);
      setAnsweringId(null);
      setAnswerText('');
      loadQuestions();
    } catch (err) {
      logger.error('Failed to answer question', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
        <h3 className="text-lg font-bold mb-2">Nenhuma pergunta</h3>
        <p className="text-neutral-500">As perguntas dos compradores aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q: any) => (
        <div key={q.id} className="bg-white rounded-xl border p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  q.status === 'ANSWERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {q.status === 'ANSWERED' ? 'Respondida' : 'Pendente'}
                </span>
                <span className="text-xs text-neutral-500">{q.from?.nickname}</span>
              </div>
              <p className="text-sm bg-neutral-50 p-3 rounded-lg">{q.text}</p>

              {q.answer && (
                <div className="mt-3 pl-4 border-l-2" style={{ borderColor: brand.accentColor }}>
                  <p className="text-sm">{q.answer.text}</p>
                </div>
              )}
            </div>

            {q.status !== 'ANSWERED' && (
              <div>
                {answeringId === q.id ? (
                  <div className="w-64 space-y-2">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Sua resposta..."
                      className="w-full px-3 py-2 text-sm border rounded-lg resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAnsweringId(null)}
                        className="flex-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-neutral-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleAnswer(q.id)}
                        className={`flex-1 px-3 py-1.5 text-xs rounded-lg ${brand.bgColor} ${brand.textColor}`}
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAnsweringId(q.id)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg ${brand.bgColor} ${brand.textColor}`}
                  >
                    Responder
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// METRICS TAB
// ============================================

const MetricsTab: React.FC<{
  brand: typeof MARKETPLACE_BRANDS[MarketplaceId];
  configId?: string;
  locale: string;
}> = ({ brand, configId, locale }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [configId]);

  const loadMetrics = async () => {
    if (!configId) return;
    try {
      const data = await marketplaceApi.getFullMetrics(configId);
      setMetrics(data);
    } catch (err) {
      logger.error('Failed to load metrics', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
        <h3 className="text-lg font-bold mb-2">Sem dados ainda</h3>
        <p className="text-neutral-500">As métricas aparecerão quando houver vendas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reputation Card */}
      {metrics.reputation && (
        <div className={`rounded-xl p-6 bg-gradient-to-r ${brand.bgGradient}`}>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center">
              <Star className="w-10 h-10" style={{ color: brand.accentColor }} />
            </div>
            <div>
              <h3 className={`text-sm uppercase tracking-wide ${brand.textColor} opacity-80`}>Reputação</h3>
              <p className={`text-3xl font-black ${brand.textColor}`}>{metrics.reputation.level}</p>
            </div>
            <div className="ml-auto flex gap-8">
              <div className="text-center">
                <div className={`text-2xl font-bold ${brand.textColor}`}>{metrics.reputation.sales}</div>
                <div className={`text-xs ${brand.textColor} opacity-80`}>Vendas</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${brand.textColor}`}>
                  {(metrics.reputation.rating * 100).toFixed(0)}%
                </div>
                <div className={`text-xs ${brand.textColor} opacity-80`}>Avaliação</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Cards */}
      {metrics.sales && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { period: 'day', label: 'Hoje' },
            { period: 'week', label: 'Esta Semana' },
            { period: 'month', label: 'Este Mês' },
          ].map(({ period, label }) => {
            const data = metrics.sales[period];
            return (
              <div key={period} className="bg-white rounded-xl border p-5">
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">{label}</div>
                <div className="text-2xl font-bold mb-2" style={{ color: brand.accentColor }}>
                  {formatCurrency(data.total_revenue, locale as Locale)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-neutral-500">Pedidos:</span> {data.total_orders}</div>
                  <div><span className="text-neutral-500">Unidades:</span> {data.total_units}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// SETTINGS TAB
// ============================================

const SettingsTab: React.FC<{
  brand: typeof MARKETPLACE_BRANDS[MarketplaceId];
  config?: MarketplaceConfig;
  onUpdate: () => void;
}> = ({ brand, config, onUpdate }) => {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-bold mb-4">Configurações da Conta</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              config?.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {config?.status === 'connected' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ambiente</label>
            <span className="text-neutral-600">{config?.environment === 'production' ? 'Produção' : 'Sandbox'}</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Markup de Preço</label>
            <span className="text-neutral-600">{config?.price_markup_percent || 0}%</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h4 className="font-bold text-yellow-800 mb-2">Importante: Estoque</h4>
        <p className="text-sm text-yellow-700">
          O estoque é gerenciado exclusivamente no site. As alterações de estoque aqui NÃO afetam o {brand.name}.
          O estoque no marketplace é atualizado automaticamente baseado no estoque do site.
        </p>
      </div>
    </div>
  );
};

// ============================================
// IMPORT PRODUCT MODAL
// ============================================

const ImportProductModal: React.FC<{
  brand: typeof MARKETPLACE_BRANDS[MarketplaceId];
  configId?: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ brand, configId, onClose, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    price: 0,
    description: '',
  });
  const [allProductsCache, setAllProductsCache] = useState<Product[]>([]);

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const all = await productsApi.getAll();
        setAllProductsCache(all);
        // Show first 20 products initially
        const mapped = all.slice(0, 20).map((p: Product) => {
          const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0;
          const price = p.variants?.[0]?.retail_price || 0;
          const images = p.base_images?.length ? p.base_images : (p.default_image_url ? [p.default_image_url] : []);
          const description = p.description?.pt || p.description?.en || '';
          return {
            id: p.id,
            name: p.name?.pt || p.name?.en || 'Produto sem nome',
            description,
            price,
            stock: totalStock,
            images,
            variants: p.variants,
          };
        });
        setProducts(mapped);
      } catch (err) {
        logger.error('Failed to load products', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Search products from cache (or reload if cache is empty)
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // Use cache if available, otherwise fetch
      const allProducts = allProductsCache.length > 0 ? allProductsCache : await productsApi.getAll();
      if (allProductsCache.length === 0) {
        setAllProductsCache(allProducts);
      }

      // Filter by search term (name in Portuguese)
      const searchLower = searchTerm.toLowerCase().trim();
      const filtered = searchLower
        ? allProducts.filter((p: Product) => {
            const name = p.name?.pt || p.name?.en || '';
            const sku = p.variants?.[0]?.sku || '';
            return name.toLowerCase().includes(searchLower) || sku.toLowerCase().includes(searchLower);
          })
        : allProducts;

      // Map to the format expected by the modal
      const mapped = filtered.slice(0, 20).map((p: Product) => {
        const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0;
        const price = p.variants?.[0]?.retail_price || 0;
        const images = p.base_images?.length ? p.base_images : (p.default_image_url ? [p.default_image_url] : []);
        const description = p.description?.pt || p.description?.en || '';

        return {
          id: p.id,
          name: p.name?.pt || p.name?.en || 'Produto sem nome',
          description,
          price,
          stock: totalStock,
          images,
          variants: p.variants,
        };
      });

      setProducts(mapped);
    } catch (err) {
      logger.error('Failed to search products', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedProduct || !configId) return;
    setIsSaving(true);
    try {
      await marketplaceApi.createMapping({
        config_id: configId,
        product_id: selectedProduct.id,
        marketplace_price: formData.price || selectedProduct.price,
      });
      onSuccess();
    } catch (err) {
      logger.error('Failed to import product', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${brand.bgGradient} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5">
              <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
            </div>
            <h2 className={`text-lg font-bold ${brand.textColor}`}>
              Adicionar Produto ao {brand.name}
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg bg-white/20 hover:bg-white/30 ${brand.textColor}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!selectedProduct ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar produtos do catálogo..."
                    className="w-full pl-10 pr-4 py-3 border rounded-xl"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                </button>
              </div>

              {/* Results */}
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setFormData({ price: product.price, description: product.description || '' });
                    }}
                    className="flex gap-4 p-4 border rounded-xl cursor-pointer hover:border-neutral-400 transition-colors"
                  >
                    <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Image className="w-8 h-8 text-neutral-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{product.name}</h4>
                      <p className="text-lg font-bold" style={{ color: brand.accentColor }}>
                        R$ {product.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-neutral-500">Estoque: {product.stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              {/* Preview */}
              <div>
                <h3 className="font-bold mb-4">Preview no {brand.name}</h3>
                <div className="border rounded-xl overflow-hidden">
                  <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                    {selectedProduct.images?.[0] ? (
                      <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-16 h-16 text-neutral-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium mb-2">{selectedProduct.name}</h4>
                    <p className="text-2xl font-bold" style={{ color: brand.accentColor }}>
                      R$ {formData.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600 mt-1">Frete grátis</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <h3 className="font-bold mb-4">Configurar Produto</h3>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Preço no {brand.name}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Preço original: R$ {selectedProduct.price.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do produto no marketplace..."
                    rows={6}
                    className="w-full px-4 py-3 border rounded-xl resize-none"
                  />
                </div>

                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-sm text-neutral-600">
                    <strong>Estoque:</strong> {selectedProduct.stock} unidades
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    O estoque é sincronizado automaticamente do site.
                  </p>
                </div>

                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full py-2 border rounded-xl hover:bg-neutral-50"
                >
                  ← Escolher outro produto
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedProduct && (
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2.5 border rounded-xl hover:bg-neutral-50">
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Publicar no {brand.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// PRODUCT EDIT MODAL
// ============================================

const ProductEditModal: React.FC<{
  brand: typeof MARKETPLACE_BRANDS[MarketplaceId];
  product: any;
  locale: string;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}> = ({ brand, product, locale, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    price: product.marketplace_price || product.product?.price || 0,
    description: product.description || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await marketplaceApi.updateMapping(product.id, {
        marketplace_price: formData.price,
      });
      await onSave(formData);
    } catch (err) {
      logger.error('Failed to save product', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${brand.bgGradient} flex items-center justify-between`}>
          <h2 className={`text-lg font-bold ${brand.textColor}`}>Editar Produto</h2>
          <button onClick={onClose} className={`p-2 rounded-lg bg-white/20 hover:bg-white/30 ${brand.textColor}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Preview */}
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </h3>
              <div className="border rounded-xl overflow-hidden">
                <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                  {product.product?.images?.[0] ? (
                    <img src={product.product.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-16 h-16 text-neutral-300" />
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-medium mb-2">{product.product?.name}</h4>
                  <p className="text-2xl font-bold" style={{ color: brand.accentColor }}>
                    {formatCurrency(formData.price, locale as Locale)}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preço</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 border rounded-xl resize-none"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-700">
                  <strong>Estoque:</strong> {product.product?.stock || 0} unidades (gerenciado no site)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 border rounded-xl hover:bg-neutral-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CONNECT MODAL
// ============================================

const ConnectModal: React.FC<{
  brand: typeof MARKETPLACE_BRANDS[MarketplaceId];
  providerId?: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ brand, providerId, onClose, onSuccess }) => {
  const [step, setStep] = useState<'credentials' | 'authorize'>('credentials');
  const [credentials, setCredentials] = useState({ client_id: '', client_secret: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Get OAuth URL and redirect
      // Remove /api do final se existir, pois o endpoint já inclui /api
      let backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      if (backendUrl.endsWith('/api')) {
        backendUrl = backendUrl.slice(0, -4);
      }
      const redirectUri = `${backendUrl}/api/marketplace/oauth/callback`;
      const { url } = await marketplaceApi.getAuthUrl(config.id, redirectUri);

      window.location.href = url;
    } catch (err) {
      logger.error('Failed to connect', err);
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
              <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${brand.textColor}`}>Conectar {brand.name}</h2>
              <p className={`text-sm ${brand.textColor} opacity-80`}>Configure suas credenciais</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client ID (App ID)</label>
            <input
              type="text"
              value={credentials.client_id}
              onChange={(e) => setCredentials({ ...credentials, client_id: e.target.value })}
              placeholder="Seu Client ID do Mercado Livre"
              className="w-full px-4 py-3 border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Client Secret</label>
            <input
              type="password"
              value={credentials.client_secret}
              onChange={(e) => setCredentials({ ...credentials, client_secret: e.target.value })}
              placeholder="Seu Client Secret"
              className="w-full px-4 py-3 border rounded-xl"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700">
              Após salvar, você será redirecionado para o {brand.name} para autorizar o acesso.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border rounded-xl hover:bg-neutral-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !credentials.client_id || !credentials.client_secret}
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

export default AdminMarketplaces;
