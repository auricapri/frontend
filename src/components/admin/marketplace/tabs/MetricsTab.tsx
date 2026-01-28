/**
 * MetricsTab - Marketplace reputation and sales metrics
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, Star, Loader2 } from 'lucide-react';
import { marketplaceApi } from '../../../../api/marketplace.api';
import { formatCurrency, type Locale } from '../../../../utils/currency';
import { logger } from '../../../../utils/logger';
import type { MarketplaceBrand } from '../types';

// ============================================================================
// Component Props
// ============================================================================

export interface MetricsTabProps {
  brand: MarketplaceBrand;
  configId?: string;
  locale: string;
}

// ============================================================================
// Component
// ============================================================================

export const MetricsTab: React.FC<MetricsTabProps> = ({ brand, configId, locale }) => {
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
              <h3 className={`text-sm uppercase tracking-wide ${brand.textColor} opacity-80`}>
                Reputação
              </h3>
              <p className={`text-3xl font-black ${brand.textColor}`}>
                {metrics.reputation.level}
              </p>
            </div>
            <div className="ml-auto flex gap-8">
              <div className="text-center">
                <div className={`text-2xl font-bold ${brand.textColor}`}>
                  {metrics.reputation.sales}
                </div>
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
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  {label}
                </div>
                <div
                  className="text-2xl font-bold mb-2"
                  style={{ color: brand.accentColor }}
                >
                  {formatCurrency(data.total_revenue, locale as Locale)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-neutral-500">Pedidos:</span> {data.total_orders}
                  </div>
                  <div>
                    <span className="text-neutral-500">Unidades:</span> {data.total_units}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
