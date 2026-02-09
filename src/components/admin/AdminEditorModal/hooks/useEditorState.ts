import { useState, useEffect, useMemo } from 'react';
import { ProductVariant, Product, PricingScenario, Asset, GlobalFinancialSettings } from '../../../../types';
import { PricingApi } from '../../../../api/pricing.api';
import { AdminEditableData, SimulationResult, ProductSubTab, TargetPriceField } from '../types';
import { generateUUID } from '../utils';

interface UseEditorStateProps {
  item: { type: string; data: AdminEditableData; editLocale: string };
  products: Product[];
  assets: Asset[];
  globalConfig?: GlobalFinancialSettings;
  onUpdateData: (newData: AdminEditableData) => void;
}

export const useEditorState = ({
  item,
  products,
  assets,
  globalConfig,
  onUpdateData,
}: UseEditorStateProps) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [productSubTab, setProductSubTab] = useState<ProductSubTab>('identity');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Matrix State
  const [simulationResults, setSimulationResults] = useState<Record<string, SimulationResult>>({});
  const [targetPriceField, setTargetPriceField] = useState<TargetPriceField>('retail_price');
  const [selectedVariantsForUpdate, setSelectedVariantsForUpdate] = useState<Set<string>>(new Set());
  const [historyVariantId, setHistoryVariantId] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<any[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Derived Active Scenario
  const activeScenario = useMemo(() => {
    if (item.type === 'product' && activeScenarioId) {
      const product = item.data as Product;
      return (product.pricing_scenarios || []).find((v) => v.id === activeScenarioId) || null;
    }
    return null;
  }, [item.data, item.type, activeScenarioId]);

  const historyVariant = useMemo(() => {
    if (item.type !== 'product' || !historyVariantId) return null;
    const product = item.data as Product;
    return (product.variants || []).find((v) => v.id === historyVariantId) || null;
  }, [item.type, item.data, historyVariantId]);

  // Initial Logic for Collections/Cats
  useEffect(() => {
    if (item.type === 'category' && item.data.id) {
      const ids = products.filter(p => p.category_id === item.data.id).map(p => p.id);
      if ((item.data as any)._associatedProductIds === undefined) {
        onUpdateData({ ...(item.data as any), _associatedProductIds: ids });
      }
    } else if (item.type === 'collection' && item.data.id) {
      const ids = products.filter(p => (p.collection_ids || []).includes(item.data.id)).map(p => p.id);
      if ((item.data as any)._associatedProductIds === undefined) {
        onUpdateData({ ...(item.data as any), _associatedProductIds: ids });
      }
    }
  }, [item.type, item.data, products]);

  // Auto-select first scenario if present and none selected
  useEffect(() => {
    if (item.type !== 'product') return;
    const productData = item.data as Product;
    if (productSubTab === 'pricing' && !activeScenarioId && (productData.pricing_scenarios?.length || 0) > 0) {
      setActiveScenarioId(productData.pricing_scenarios![0].id);
    }
  }, [productSubTab, item.type, activeScenarioId, item.data]);

  // Auto-set target field based on scenario channel
  useEffect(() => {
    if (activeScenario) {
      setTargetPriceField(activeScenario.channel === 'wholesale' ? 'wholesale_price' : 'retail_price');
    }
  }, [activeScenario]);

  const handleAddScenario = () => {
    if (item.type !== 'product') return;
    const productData = item.data as Product;
    const newSc: PricingScenario = {
      id: generateUUID(),
      name: 'Novo Cenário',
      channel: 'ecommerce',
      region_uf: 'SP',
      tax_rate_percent: 0,
      ads_cac_target: 0,
      commission_percent: 0,
      target_margin_percent: 20
    };
    const currentSc = productData.pricing_scenarios || [];
    onUpdateData({ ...productData, pricing_scenarios: [...currentSc, newSc] } as unknown as AdminEditableData);
    setActiveScenarioId(newSc.id);
  };

  const updateScenario = (id: string, field: keyof PricingScenario, value: PricingScenario[keyof PricingScenario]) => {
    const productData = item.data as Product;
    const scs = [...(productData.pricing_scenarios || [])];
    const idx = scs.findIndex((s: PricingScenario) => s.id === id);
    if (idx === -1) return;
    scs[idx] = { ...scs[idx], [field]: value };
    onUpdateData({ ...productData, pricing_scenarios: scs });
  };

  const calculateMatrix = async () => {
    if (item.type !== 'product') return;
    const productData = item.data as Product;
    const variants = (productData.variants || []) as ProductVariant[];

    if (!activeScenario) {
      alert('Erro: Cenario de precificacao nao encontrado.');
      return;
    }

    if (!variants || variants.length === 0) {
      alert('Nenhuma variante encontrada para calcular.');
      return;
    }

    try {
      const pricingApi = new PricingApi();
      const response = await pricingApi.calculateMatrix({
        variants,
        assets: assets || [],
        scenario: {
          channel: activeScenario.channel,
          region_uf: activeScenario.region_uf,
          target_margin_percent: activeScenario.target_margin_percent,
          commission_percent: activeScenario.commission_percent,
          ads_cac_target: activeScenario.ads_cac_target,
        },
        hasFreeShipping: productData.has_free_shipping,
        financialSettings: globalConfig,
      });

      setSimulationResults(response.results);
      setSelectedVariantsForUpdate(new Set(Object.keys(response.results)));
    } catch (error) {
      console.error('Error calculating matrix:', error);
      alert('Erro ao calcular matriz de precificação. Tente novamente.');
    }
  };

  const openPriceHistory = async (variantId: string) => {
    try {
      setHistoryVariantId(variantId);
      setHistoryLoading(true);
      setHistoryEntries(null);
      const pricingApi = new PricingApi();
      const entries = await pricingApi.getVariantPriceHistory(variantId, { limit: 20, offset: 0 });
      setHistoryEntries(entries);
    } catch (error) {
      console.error('Error loading price history:', error);
      alert('Erro ao carregar histórico de preços.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (item.type !== 'product') return;
    const productData = item.data as Product;
    const allIds = (productData.variants || []).map((v: any) => v.id);
    if (selectedVariantsForUpdate.size === allIds.length) {
      setSelectedVariantsForUpdate(new Set());
    } else {
      setSelectedVariantsForUpdate(new Set(allIds));
    }
  };

  const toggleVariantSelection = (id: string) => {
    const newSet = new Set(selectedVariantsForUpdate);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedVariantsForUpdate(newSet);
  };

  const applyPricesToSelected = () => {
    if (item.type !== 'product') return;
    const productData = item.data as Product;
    const variants = [...(productData.variants || [])];
    const newVariants = variants.map((v: ProductVariant) => {
      if (selectedVariantsForUpdate.has(v.id) && simulationResults[v.id]) {
        return {
          ...v,
          [targetPriceField]: Number(simulationResults[v.id].suggestedPrice.toFixed(2))
        };
      }
      return v;
    });
    onUpdateData({ ...productData, variants: newVariants } as unknown as AdminEditableData);
    alert(`Preços aplicados com sucesso para ${selectedVariantsForUpdate.size} variantes selecionadas!`);
  };

  const closePriceHistory = () => {
    setHistoryVariantId(null);
    setHistoryEntries(null);
  };

  return {
    // State
    uploading,
    setUploading,
    activeTab,
    setActiveTab,
    productSubTab,
    setProductSubTab,
    activeScenarioId,
    setActiveScenarioId,
    simulationResults,
    targetPriceField,
    setTargetPriceField,
    selectedVariantsForUpdate,
    historyVariantId,
    historyEntries,
    historyLoading,

    // Derived
    activeScenario,
    historyVariant,

    // Handlers
    handleAddScenario,
    updateScenario,
    calculateMatrix,
    openPriceHistory,
    closePriceHistory,
    toggleSelectAll,
    toggleVariantSelection,
    applyPricesToSelected,
  };
};
