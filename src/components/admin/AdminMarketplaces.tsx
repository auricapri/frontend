import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Plus, Check, X, AlertCircle,
  ExternalLink, Settings, Activity, FileText, Package, Loader2
} from 'lucide-react';
import { marketplaceApi } from '../../api/marketplace.api';
import type {
  MarketplaceProvider,
  MarketplaceConfig,
  MarketplaceProductMapping,
  MarketplaceSyncLog,
  SyncStats,
  SyncStatus
} from '../../types/marketplace';
import { logger } from '../../utils/logger';
import { formatCurrency } from '../../utils/currency';
import { Locale } from '../../i18n';

interface AdminMarketplacesProps {
  locale: string;
}

type SubTab = 'integrations' | 'mappings' | 'logs';

const AdminMarketplaces: React.FC<AdminMarketplacesProps> = ({ locale }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('integrations');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [providers, setProviders] = useState<MarketplaceProvider[]>([]);
  const [configs, setConfigs] = useState<MarketplaceConfig[]>([]);
  const [mappings, setMappings] = useState<MarketplaceProductMapping[]>([]);
  const [logs, setLogs] = useState<MarketplaceSyncLog[]>([]);
  const [stats, setStats] = useState<SyncStats | null>(null);

  // UI state
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<MarketplaceProvider | null>(null);
  const [editingConfig, setEditingConfig] = useState<MarketplaceConfig | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [providersData, configsData, statsData] = await Promise.all([
        marketplaceApi.getProviders(),
        marketplaceApi.getConfigs(),
        marketplaceApi.getSyncStats(),
      ]);

      setProviders(providersData);
      setConfigs(configsData);
      setStats(statsData);

      // Fetch mappings and logs for selected config or all
      if (activeSubTab === 'mappings') {
        const mappingsData = await marketplaceApi.getMappings({ limit: 100 });
        setMappings(mappingsData);
      } else if (activeSubTab === 'logs') {
        const logsData = await marketplaceApi.getLogs({ limit: 50 });
        setLogs(logsData);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(message);
      logger.error('Failed to fetch marketplace data', err, { context: 'AdminMarketplaces' });
    } finally {
      setIsLoading(false);
    }
  }, [activeSubTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTestConnection = async (configId: string) => {
    setIsTestingConnection(configId);
    try {
      const result = await marketplaceApi.testConnection(configId);
      if (result.success) {
        alert('Conexão bem-sucedida!');
      } else {
        alert(`Falha na conexão: ${result.message || 'Erro desconhecido'}`);
      }
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao testar conexão';
      alert(`Erro: ${message}`);
    } finally {
      setIsTestingConnection(null);
    }
  };

  const handleSyncPending = async () => {
    setIsSyncing(true);
    try {
      const result = await marketplaceApi.syncPending(selectedConfigId || undefined);
      const successCount = result.results.filter(r => r.status === 'success').length;
      const errorCount = result.results.filter(r => r.status === 'error').length;
      alert(`Sincronização concluída: ${successCount} sucesso, ${errorCount} erros`);
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao sincronizar';
      alert(`Erro: ${message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      connected: { color: 'bg-green-100 text-green-800', icon: <Check className="w-3 h-3" /> },
      disconnected: { color: 'bg-neutral-100 text-neutral-600', icon: <X className="w-3 h-3" /> },
      error: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-3 h-3" /> },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <RefreshCw className="w-3 h-3" /> },
      synced: { color: 'bg-green-100 text-green-800', icon: <Check className="w-3 h-3" /> },
    };

    const config = statusConfig[status] || statusConfig.disconnected;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US');
  };

  const renderIntegrations = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border">
            <div className="text-2xl font-bold">{stats.totalMappings}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Produtos Mapeados</div>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <div className="text-2xl font-bold text-green-600">{stats.synced}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Sincronizados</div>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Pendentes</div>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Com Erro</div>
          </div>
        </div>
      )}

      {/* Providers Grid */}
      <div className="grid grid-cols-3 gap-4">
        {providers.map(provider => {
          const config = configs.find(c => c.provider_id === provider.id);

          return (
            <div
              key={provider.id}
              className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {provider.logo_url ? (
                    <img
                      src={provider.logo_url}
                      alt={provider.name}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-neutral-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold">{provider.name}</h3>
                    <div className="text-xs text-neutral-500">
                      Comissão: {provider.commission_default}%
                    </div>
                  </div>
                </div>
                {config && getStatusBadge(config.status)}
              </div>

              {config ? (
                <div className="space-y-3">
                  <div className="text-xs text-neutral-500">
                    <div>Ambiente: <span className="font-medium">{config.environment}</span></div>
                    <div>Último sync: <span className="font-medium">{formatDate(config.last_sync_at)}</span></div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestConnection(config.id)}
                      disabled={isTestingConnection === config.id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isTestingConnection === config.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Activity className="w-3 h-3" />
                      )}
                      Testar
                    </button>
                    <button
                      onClick={() => {
                        setEditingConfig(config);
                        setSelectedProvider(provider);
                        setShowConfigModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      <Settings className="w-3 h-3" />
                      Editar
                    </button>
                  </div>

                  {provider.documentation_url && (
                    <a
                      href={provider.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Documentação
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-500">
                    Configure esta integração para sincronizar seus produtos.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedProvider(provider);
                      setEditingConfig(null);
                      setShowConfigModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Configurar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMappings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Produtos Mapeados</h3>
        <div className="flex gap-2">
          <select
            value={selectedConfigId || ''}
            onChange={(e) => setSelectedConfigId(e.target.value || null)}
            className="px-3 py-1.5 text-sm border rounded-lg"
          >
            <option value="">Todos os Marketplaces</option>
            {configs.map(config => (
              <option key={config.id} value={config.id}>
                {config.provider?.name || 'Desconhecido'}
              </option>
            ))}
          </select>
          <button
            onClick={handleSyncPending}
            disabled={isSyncing}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sincronizar Pendentes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Produto</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Marketplace</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">ID Externo</th>
              <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Preço</th>
              <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Estoque</th>
              <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Status</th>
              <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Última Sync</th>
              <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mappings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                  Nenhum mapeamento encontrado
                </td>
              </tr>
            ) : (
              mappings.map(mapping => (
                <tr key={mapping.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm">{mapping.product_id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm">{mapping.config?.provider?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono">{mapping.external_product_id || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {mapping.marketplace_price
                      ? formatCurrency(mapping.marketplace_price, locale as Locale)
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">{mapping.marketplace_stock ?? '-'}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(mapping.sync_status)}</td>
                  <td className="px-4 py-3 text-sm text-right text-neutral-500">
                    {formatDate(mapping.last_sync_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {mapping.external_url && (
                        <a
                          href={mapping.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-neutral-100 rounded"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => marketplaceApi.syncMapping(mapping.id).then(fetchData)}
                        className="p-1 hover:bg-neutral-100 rounded"
                        title="Sincronizar"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Logs de Sincronização</h3>
        <button
          onClick={fetchData}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Data</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Marketplace</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Ação</th>
              <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Status</th>
              <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Duração</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Erro</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Nenhum log encontrado
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm">{formatDate(log.created_at)}</td>
                  <td className="px-4 py-3 text-sm">{log.config?.provider?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono">{log.action}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(log.status)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate" title={log.error_message || undefined}>
                    {log.error_message || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Marketplaces</h1>
          <p className="text-neutral-500 text-sm">
            Gerencie integrações com Mercado Livre, Shopee, AliExpress e outros
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-1 bg-neutral-200 p-1 rounded-lg w-fit">
        {[
          { id: 'integrations', label: 'Integrações', icon: Settings },
          { id: 'mappings', label: 'Produtos', icon: Package },
          { id: 'logs', label: 'Logs', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as SubTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSubTab === tab.id
                ? 'bg-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSubTab === 'integrations' && renderIntegrations()}
      {activeSubTab === 'mappings' && renderMappings()}
      {activeSubTab === 'logs' && renderLogs()}

      {/* Config Modal - Placeholder for now */}
      {showConfigModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingConfig ? 'Editar' : 'Configurar'} {selectedProvider.name}
              </h2>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 hover:bg-neutral-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-neutral-500 text-sm">
                Preencha as credenciais necessárias para conectar com {selectedProvider.name}.
              </p>

              {selectedProvider.required_fields.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type === 'password' ? 'password' : 'text'}
                    placeholder={field.help}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  />
                  {field.help && (
                    <p className="text-xs text-neutral-500 mt-1">{field.help}</p>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    alert('Em desenvolvimento: salvar configuração');
                    setShowConfigModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMarketplaces;
