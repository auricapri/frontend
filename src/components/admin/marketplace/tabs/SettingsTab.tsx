/**
 * SettingsTab - Marketplace account settings and configuration
 */

import React from 'react';
import type { MarketplaceConfig } from '../../../../types/marketplace';
import type { MarketplaceBrand } from '../types';

// ============================================================================
// Component Props
// ============================================================================

export interface SettingsTabProps {
  brand: MarketplaceBrand;
  config?: MarketplaceConfig;
  onUpdate: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const SettingsTab: React.FC<SettingsTabProps> = ({ brand, config, onUpdate }) => {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-bold mb-4">Configurações da Conta</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                config?.status === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {config?.status === 'connected' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ambiente</label>
            <span className="text-neutral-600">
              {config?.environment === 'production' ? 'Produção' : 'Sandbox'}
            </span>
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
          O estoque é gerenciado exclusivamente no site. As alterações de estoque aqui NÃO
          afetam o {brand.name}. O estoque no marketplace é atualizado automaticamente
          baseado no estoque do site.
        </p>
      </div>
    </div>
  );
};
