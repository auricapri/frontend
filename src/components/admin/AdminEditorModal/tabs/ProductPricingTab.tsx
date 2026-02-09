import React from 'react';
import {
  Plus, TrendingUp, Calculator, DollarSign, Check, ArrowDown,
  Landmark, Truck, Loader2
} from 'lucide-react';
import { Product, ProductVariant, PricingScenario } from '../../../../types';
import { Locale } from '../../../../i18n';
import { formatCurrency } from '../../../../utils/currency';
import { SimulationResult, LocalizedText, TargetPriceField } from '../types';

interface ProductPricingTabProps {
  productData: Product;
  activeScenario: PricingScenario | null;
  activeScenarioId: string | null;
  simulationResults: Record<string, SimulationResult>;
  targetPriceField: TargetPriceField;
  selectedVariantsForUpdate: Set<string>;
  historyVariantId: string | null;
  historyVariant: ProductVariant | null;
  historyEntries: any[] | null;
  historyLoading: boolean;
  locale: Locale;
  getLocVal: (obj: LocalizedText | string | null | undefined) => string;
  setActiveScenarioId: (id: string) => void;
  setTargetPriceField: (field: TargetPriceField) => void;
  handleAddScenario: () => void;
  updateScenario: (id: string, field: keyof PricingScenario, value: any) => void;
  calculateMatrix: () => void;
  openPriceHistory: (variantId: string) => void;
  closePriceHistory: () => void;
  toggleSelectAll: () => void;
  toggleVariantSelection: (id: string) => void;
  applyPricesToSelected: () => void;
}

export const ProductPricingTab: React.FC<ProductPricingTabProps> = ({
  productData,
  activeScenario,
  activeScenarioId,
  simulationResults,
  targetPriceField,
  selectedVariantsForUpdate,
  historyVariantId,
  historyVariant,
  historyEntries,
  historyLoading,
  locale,
  getLocVal,
  setActiveScenarioId,
  setTargetPriceField,
  handleAddScenario,
  updateScenario,
  calculateMatrix,
  openPriceHistory,
  closePriceHistory,
  toggleSelectAll,
  toggleVariantSelection,
  applyPricesToSelected,
}) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto pb-20">
      {/* 1. SCENARIO SELECTOR */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar border-b border-neutral-100">
        <button
          onClick={handleAddScenario}
          className="flex-none flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
        >
          <Plus className="w-3 h-3" /> Novo Cenário
        </button>
        {(productData.pricing_scenarios || []).map((sc: PricingScenario) => (
          <button
            key={sc.id}
            onClick={() => setActiveScenarioId(sc.id)}
            className={`flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeScenarioId === sc.id
                ? 'bg-white border-black shadow-md text-black'
                : 'bg-neutral-50 border-neutral-100 text-neutral-400 hover:text-black'
            }`}
          >
            {sc.name}
          </button>
        ))}
      </div>

      {activeScenario ? (
        <div className="space-y-12">
          {/* 2. SCENARIO CONFIG */}
          <ScenarioConfig
            activeScenario={activeScenario}
            updateScenario={updateScenario}
          />

          {/* 3. INFO BADGES & ACTIONS */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                <Landmark className="w-3 h-3 text-emerald-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
                  MEI - DAS Fixo R$71,60/mes
                </span>
              </div>
              {productData.has_free_shipping && (
                <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                  <Truck className="w-3 h-3 text-blue-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-700">
                    Frete Gratis (+R$35 no preco)
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={calculateMatrix}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3"
            >
              <Calculator className="w-4 h-4" /> Calcular Matriz
            </button>
          </div>

          {/* 4. RESULTS TABLE */}
          {Object.keys(simulationResults).length > 0 && (
            <ResultsTable
              productData={productData}
              simulationResults={simulationResults}
              targetPriceField={targetPriceField}
              selectedVariantsForUpdate={selectedVariantsForUpdate}
              historyVariantId={historyVariantId}
              historyVariant={historyVariant}
              historyEntries={historyEntries}
              historyLoading={historyLoading}
              locale={locale}
              getLocVal={getLocVal}
              setTargetPriceField={setTargetPriceField}
              toggleSelectAll={toggleSelectAll}
              toggleVariantSelection={toggleVariantSelection}
              openPriceHistory={openPriceHistory}
              closePriceHistory={closePriceHistory}
              applyPricesToSelected={applyPricesToSelected}
            />
          )}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center justify-center text-neutral-300 border-2 border-dashed border-neutral-100 rounded-[3rem]">
          <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest">Nenhum cenário selecionado</p>
          <p className="text-[9px] uppercase tracking-widest mt-1">Crie um cenário para precificar seus produtos</p>
        </div>
      )}
    </div>
  );
};

// Scenario Config Component
interface ScenarioConfigProps {
  activeScenario: PricingScenario;
  updateScenario: (id: string, field: keyof PricingScenario, value: any) => void;
}

const ScenarioConfig: React.FC<ScenarioConfigProps> = ({ activeScenario, updateScenario }) => {
  return (
    <div className="bg-neutral-50 p-8 rounded-[3rem] border border-neutral-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nome do Cenário</label>
        <input
          className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all"
          value={activeScenario.name}
          onChange={e => updateScenario(activeScenario.id, 'name', e.target.value)}
        />
      </div>
      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Canal de Venda</label>
        <select
          className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none"
          value={activeScenario.channel}
          onChange={e => updateScenario(activeScenario.id, 'channel', e.target.value)}
        >
          <option value="ecommerce">E-commerce (D2C)</option>
          <option value="marketplace">Marketplace</option>
          <option value="wholesale">Atacado (B2B)</option>
        </select>
      </div>
      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Margem Alvo (%)</label>
        <div className="relative">
          <input
            type="number"
            className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all"
            value={activeScenario.target_margin_percent}
            onChange={e => updateScenario(activeScenario.id, 'target_margin_percent', Number(e.target.value))}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-300">%</span>
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Custo Marketing (CAC)</label>
        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-300" />
          <input
            type="number"
            className="w-full p-4 pl-10 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all"
            value={activeScenario.ads_cac_target}
            onChange={e => updateScenario(activeScenario.id, 'ads_cac_target', Number(e.target.value))}
          />
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Comissão (MktPlace)</label>
        <div className="relative">
          <input
            type="number"
            className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all"
            value={activeScenario.commission_percent}
            onChange={e => updateScenario(activeScenario.id, 'commission_percent', Number(e.target.value))}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-300">%</span>
        </div>
      </div>
    </div>
  );
};

// Results Table Component
interface ResultsTableProps {
  productData: Product;
  simulationResults: Record<string, SimulationResult>;
  targetPriceField: TargetPriceField;
  selectedVariantsForUpdate: Set<string>;
  historyVariantId: string | null;
  historyVariant: ProductVariant | null;
  historyEntries: any[] | null;
  historyLoading: boolean;
  locale: Locale;
  getLocVal: (obj: LocalizedText | string | null | undefined) => string;
  setTargetPriceField: (field: TargetPriceField) => void;
  toggleSelectAll: () => void;
  toggleVariantSelection: (id: string) => void;
  openPriceHistory: (variantId: string) => void;
  closePriceHistory: () => void;
  applyPricesToSelected: () => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  productData,
  simulationResults,
  targetPriceField,
  selectedVariantsForUpdate,
  historyVariantId,
  historyVariant,
  historyEntries,
  historyLoading,
  locale,
  getLocVal,
  setTargetPriceField,
  toggleSelectAll,
  toggleVariantSelection,
  openPriceHistory,
  closePriceHistory,
  applyPricesToSelected,
}) => {
  return (
    <div className="bg-white border border-neutral-200 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
      {/* Target Selector Bar */}
      <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
            Atrelar sugestão à variável:
          </span>
          <div className="relative">
            <select
              value={targetPriceField}
              onChange={(e) => setTargetPriceField(e.target.value as TargetPriceField)}
              className="appearance-none bg-white border border-neutral-200 pl-4 pr-10 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none hover:border-black cursor-pointer transition-all"
            >
              <option value="retail_price">Preço Varejo (Retail Price)</option>
              <option value="wholesale_price">Preço Atacado (Wholesale Price)</option>
            </select>
            <ArrowDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
          </div>
        </div>
      </div>

      <table className="w-full text-left">
        <thead className="bg-neutral-50 text-[9px] font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-100">
          <tr>
            <th className="p-6 w-12 text-center">
              <input
                type="checkbox"
                className="w-4 h-4 accent-black cursor-pointer"
                checked={selectedVariantsForUpdate.size > 0 && selectedVariantsForUpdate.size === (productData.variants || []).length}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="p-6">Variante</th>
            <th className="p-6 text-right">Composição de Custo</th>
            <th className="p-6 text-right text-blue-600">Preço Sugerido</th>
            <th className="p-6 text-right">Preço Atual ({targetPriceField === 'retail_price' ? 'Varejo' : 'Atacado'})</th>
            <th className="p-6 text-right">Histórico</th>
            <th className="p-6 text-right">Margem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {(productData.variants || []).map((v: ProductVariant) => {
            const result = simulationResults[v.id];
            if (!result) return null;

            const suggested = result.suggestedPrice || 0;
            const current = targetPriceField === 'wholesale_price' ? v.wholesale_price : v.retail_price;
            const diff = current - suggested;

            return (
              <tr
                key={v.id}
                className={`transition-colors ${selectedVariantsForUpdate.has(v.id) ? 'bg-blue-50/20' : 'hover:bg-neutral-50/50'}`}
              >
                <td className="p-6 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-black cursor-pointer"
                    checked={selectedVariantsForUpdate.has(v.id)}
                    onChange={() => toggleVariantSelection(v.id)}
                  />
                </td>
                <td className="p-6">
                  <span className="text-xs font-bold block">{getLocVal(v.color_name)} - {v.size}</span>
                  <span className="text-[9px] font-mono text-neutral-400">{v.sku}</span>
                </td>
                <td className="p-6 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold">
                      {formatCurrency(result.breakdown.production + result.breakdown.assets, locale)}
                    </span>
                    <div className="flex flex-col text-[8px] text-neutral-400 font-medium">
                      <span>Prod: {formatCurrency(result.breakdown.production, locale)}</span>
                      <span className="text-blue-500 font-bold">Insumos: {formatCurrency(result.breakdown.assets, locale)}</span>
                      <span>Fixos: {formatCurrency(result.breakdown.fixed, locale)}</span>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-right">
                  <span className="text-sm font-black text-blue-600 block">{formatCurrency(suggested, locale)}</span>
                  <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">Base Ideal</span>
                </td>
                <td className="p-6 text-right text-xs font-medium">
                  {formatCurrency(current, locale)}
                </td>
                <td className="p-6 text-right">
                  <button
                    onClick={() => openPriceHistory(v.id)}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black hover:scale-105 transition-all"
                  >
                    Histórico
                  </button>
                </td>
                <td className="p-6 text-right">
                  {diff < -0.01 ? (
                    <span className="text-[9px] font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">Baixa</span>
                  ) : (
                    <span className="text-[9px] font-bold text-green-500 bg-green-50 px-3 py-1 rounded-full">OK</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center">
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pl-4">
          {selectedVariantsForUpdate.size} variantes selecionadas
        </div>
        <button
          onClick={applyPricesToSelected}
          disabled={selectedVariantsForUpdate.size === 0}
          className="px-10 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
        >
          <Check className="w-4 h-4" /> Aplicar Selecionados
        </button>
      </div>

      {/* History Section */}
      {historyVariantId && (
        <HistorySection
          historyVariant={historyVariant}
          historyEntries={historyEntries}
          historyLoading={historyLoading}
          locale={locale}
          getLocVal={getLocVal}
          onClose={closePriceHistory}
        />
      )}
    </div>
  );
};

// History Section Component
interface HistorySectionProps {
  historyVariant: ProductVariant | null;
  historyEntries: any[] | null;
  historyLoading: boolean;
  locale: Locale;
  getLocVal: (obj: LocalizedText | string | null | undefined) => string;
  onClose: () => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({
  historyVariant,
  historyEntries,
  historyLoading,
  locale,
  getLocVal,
  onClose,
}) => {
  return (
    <div className="border-t border-neutral-100 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
            Histórico de preços
          </span>
          {historyVariant && (
            <span className="text-xs font-bold text-neutral-800">
              {getLocVal(historyVariant.color_name)} - {historyVariant.size} · {historyVariant.sku}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-neutral-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-50 transition-all"
        >
          Fechar
        </button>
      </div>

      {historyLoading ? (
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Carregando histórico...</span>
        </div>
      ) : historyEntries && historyEntries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-neutral-50 text-[9px] font-black uppercase tracking-widest text-neutral-400 border border-neutral-100">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Ação</th>
                <th className="p-3 text-right">Preço Antigo</th>
                <th className="p-3 text-right">Preço Novo</th>
                <th className="p-3 text-right">Cenário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {historyEntries.map((entry: any) => {
                const meta = entry.metadata || {};
                const oldPrice = typeof meta.old_price === 'number' ? meta.old_price : null;
                const newPrice = typeof meta.new_price === 'number' ? meta.new_price : null;
                const scenarioName =
                  (meta.scenario && meta.scenario.name) ||
                  meta.scenario_name ||
                  '';
                return (
                  <tr key={entry.id}>
                    <td className="p-3 text-xs text-neutral-500">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="p-3 text-xs font-bold uppercase text-neutral-700">
                      {entry.action || '-'}
                    </td>
                    <td className="p-3 text-xs text-right">
                      {oldPrice != null ? formatCurrency(oldPrice, locale) : '-'}
                    </td>
                    <td className="p-3 text-xs text-right">
                      {newPrice != null ? formatCurrency(newPrice, locale) : '-'}
                    </td>
                    <td className="p-3 text-[10px] text-right text-neutral-400">
                      {scenarioName || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
          Nenhum histórico de preço encontrado.
        </p>
      )}
    </div>
  );
};
