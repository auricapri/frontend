
import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Save, Plus, Trash2, ImageIcon, Sliders, Upload, Loader2,
  Eye, Layout, Check, Calculator, TrendingUp, Scale, Ruler, DollarSign,
  Monitor, Package, Link, ArrowDown, FileText, Landmark, Truck, MousePointer2,
  // Category icons
  Shirt, Watch, Gem, Glasses, ShoppingBag, Crown, Sparkles, Heart,
  Footprints, Gift, Flower2, Ribbon, type LucideIcon
} from 'lucide-react';

// Available icons for categories
const CATEGORY_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: 'Shirt', icon: Shirt, label: 'Roupas' },
  { name: 'ShoppingBag', icon: ShoppingBag, label: 'Bolsas' },
  { name: 'Watch', icon: Watch, label: 'Relógios' },
  { name: 'Gem', icon: Gem, label: 'Joias' },
  { name: 'Glasses', icon: Glasses, label: 'Óculos' },
  { name: 'Footprints', icon: Footprints, label: 'Calçados' },
  { name: 'Crown', icon: Crown, label: 'Acessórios' },
  { name: 'Sparkles', icon: Sparkles, label: 'Destaque' },
  { name: 'Heart', icon: Heart, label: 'Favoritos' },
  { name: 'Gift', icon: Gift, label: 'Presentes' },
  { name: 'Flower2', icon: Flower2, label: 'Flores' },
  { name: 'Ribbon', icon: Ribbon, label: 'Laços' },
];
import { Locale } from '../../i18n';
import { ProductVariant, Category, PricingScenario, Collection, Product, GlobalFinancialSettings, UserMode, Asset, SizeGuide, Supplier } from '../../types';
import { Gender } from '../../constants/enums';
import { supabase } from '../../utils/supabase';
import { formatCurrency } from '../../utils/currency';
import { ProductDetail } from '../product';
import { Hero } from '../shared';
import { CollectionDetail } from '../product';
import { PricingApi } from '../../api/pricing.api';
import { HotspotsEditor } from './HotspotsEditor';

type AdminEditableData = Product | Category | Collection | Asset | SizeGuide | Supplier;

interface AdminEditableItem {
  type: string;
  data: AdminEditableData;
  editLocale: Locale;
}

interface AdminEditorModalProps {
  item: AdminEditableItem;
  categories: Category[];
  collections?: Collection[];
  products?: Product[];
  assets?: Asset[];
  sizeGuides?: SizeGuide[];
  suppliers?: Supplier[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onUpdateData: (newData: AdminEditableData) => void;
  onLocaleChange: (l: Locale) => void;
  onCloneLocale: (from: Locale) => void;
  onDelete?: (id: string) => void;
  globalConfig?: GlobalFinancialSettings;
  t: (key: string) => string;
  locale: Locale;
}

interface SimulationResult {
  suggestedPrice: number;
  breakdown: {
    production: number;
    assets: number;
    fixed: number;
    logistics: number;
    marketing: number;
    taxes: number;
    margin: number;
  }
}

const AdminEditorModal: React.FC<AdminEditorModalProps> = ({ 
  item, categories, collections = [], products = [], assets = [], sizeGuides = [], suppliers = [], onClose, onSave, onUpdateData, onLocaleChange, onCloneLocale: _onCloneLocale, onDelete: _onDelete, globalConfig: _globalConfig, t, locale
}) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [productSubTab, setProductSubTab] = useState<'identity' | 'pricing' | 'hotspots'>('identity');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  
  // Matrix State
  const [simulationResults, setSimulationResults] = useState<Record<string, SimulationResult>>({}); 
  const [targetPriceField, setTargetPriceField] = useState<'retail_price' | 'wholesale_price'>('retail_price');
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

  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const getLocVal = (obj: LocalizedText | string | null | undefined): string => {
    if (obj === null || obj === undefined) return '';
    
    // Handle Object (Already parsed or came as object)
    if (typeof obj === 'object') {
      const val = obj[item.editLocale] || obj['pt'] || obj['en'] || Object.values(obj).find(v => typeof v === 'string' && !!v);
      return typeof val === 'string' ? val : '';
    }

    // Handle String (Possibly JSON)
    if (typeof obj === 'string') {
      if (obj.trim().startsWith('{')) {
        try { 
            const parsed = JSON.parse(obj);
            // Recursive
            return getLocVal(parsed); 
        } catch { 
            return obj; 
        }
      }
      return obj;
    }
    return String(obj || '');
  };

  const updateNested = (field: string, value: string | number | boolean | null | undefined) => {
    const newData = { ...item.data } as Record<string, unknown>;
    
    // Ensure the field exists as an object before assigning
    let currentFieldVal: unknown = newData[field];
    
    // If it's string JSON, parse it first
    if (typeof currentFieldVal === 'string' && currentFieldVal.startsWith('{')) {
        try { 
            currentFieldVal = JSON.parse(currentFieldVal); 
        } catch { 
            // ignore 
        }
    }

    let fieldObject: Record<string, unknown>;

    if (currentFieldVal && typeof currentFieldVal === 'object') {
        fieldObject = currentFieldVal as Record<string, unknown>;
    } else {
        const existingStr = typeof currentFieldVal === 'string' ? currentFieldVal : '';
        fieldObject = { pt: existingStr, en: existingStr, es: '', fr: '' };
    }

    newData[field] = { ...fieldObject, [item.editLocale]: value };
    onUpdateData(newData as unknown as AdminEditableData);
  };

  const updateSimple = (field: string, value: string | number | boolean | null | undefined | string[]) => {
    onUpdateData({ ...item.data, [field]: value } as AdminEditableData);
  };

  const handleMasterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('master');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      const { error } = await supabase.storage.from('products').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      const current = (item.data as Product).base_images || [];
      onUpdateData({ ...item.data, base_images: [...current, publicUrl] });
    } catch (err: unknown) { 
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Upload error: ${message}`); 
    } finally { setUploading(null); }
  };
  
  const handleGenericUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string = 'image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('generic');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${item.type}-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `misc/${fileName}`;
      const { error } = await supabase.storage.from('products').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      
      // For banners/cats/collections, image_url might not be localized in older records, but should be for Banners?
      // Banners usually rely on localized images for text. Categories usually one image.
      if (item.type === 'banner') {
         updateNested('image_url', publicUrl);
      } else {
         // Categories/Collections usually have single image
         updateSimple(field, publicUrl);
      }
    } catch (err: any) { alert(`Upload error: ${err.message}`); } finally { setUploading(null); }
  };

  const handleSelectVariantImage = (variantIndex: number, imageUrl: string) => {
    if (item.type !== 'product') return;
    const newData = { ...(item.data as Product) };
    const variants = [...(newData.variants || [])];
    variants[variantIndex] = { ...variants[variantIndex], variant_images: [imageUrl] };
    onUpdateData({ ...newData, variants });
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    if (item.type !== 'product') return;
    const newData = { ...(item.data as Product) };
    const variants = [...(newData.variants || [])];
    if (!variants[index]) return;
    variants[index] = { ...variants[index], [field]: value };
    newData.variants = variants;
    onUpdateData(newData);
  };

  const updateVariantLocalized = (idx: number, field: string, value: string) => {
    if (item.type !== 'product') return;
    const newData = { ...(item.data as Product) };
    const variants = [...(newData.variants || [])];
    if (!variants[idx]) return;
    const v = { ...variants[idx] };
    
    let currentVal = v[field as keyof ProductVariant];
    // JSON parsing check
    if (typeof currentVal === 'string' && (currentVal as string).startsWith('{')) {
        const parsed = (() => {
          try { return JSON.parse(currentVal as string); } catch { return null; }
        })();
        if (parsed) currentVal = parsed;
    }

    if (!currentVal || typeof currentVal !== 'object') {
        const existingStr = typeof currentVal === 'string' ? currentVal : '';
        currentVal = { pt: existingStr, en: existingStr, es: '', fr: '' };
    }

    // @ts-ignore
    v[field] = { ...currentVal, [item.editLocale]: value };
    variants[idx] = v;
    newData.variants = variants;
    onUpdateData(newData as unknown as AdminEditableData);
  };

  // Asset Linking Logic
  const handleToggleAsset = (variantIdx: number, assetId: string) => {
      if (item.type !== 'product') return;
      const newData = { ...(item.data as Product) };
      const variants = [...(newData.variants || [])];
      const variant = variants[variantIdx];
      const currentLinks = variant.correlated_assets || [];
      
      let newLinks;
      if (currentLinks.find((l: any) => l.asset_id === assetId)) {
          newLinks = currentLinks.filter((l: any) => l.asset_id !== assetId);
      } else {
          newLinks = [...currentLinks, { asset_id: assetId, quantity_required: 1 }];
      }
      
      variants[variantIdx] = { ...variant, correlated_assets: newLinks };
      onUpdateData({ ...newData, variants } as unknown as AdminEditableData);
  };

  const addVariant = () => {
    if (item.type !== 'product') return;
    const newData = { ...(item.data as Product) };
    const variants = [...(newData.variants || [])];
    variants.push({
      id: generateUUID(),
      product_id: (item.data as Product).id,
      sku: `SKU-${Date.now()}`,
      size: 'Unique',
      color_name: { pt: 'Nova Cor', en: 'New Color', es: '', fr: '' },
      color_hex: '#000000',
      retail_price: 0,
      wholesale_price: 0,
      cost_price: 0,
      weight_g: 0,
      stock_quantity: 1,
      variant_images: [],
      is_active: true,
      face_swap_enabled: false,
      correlated_assets: [],
      composition: { pt: '', en: '' },
      care_instructions: { pt: '', en: '' }
    });
    newData.variants = variants;
    onUpdateData(newData as unknown as AdminEditableData);
  };

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
      const payloadFinancial: GlobalFinancialSettings | undefined = (global as any).financialConfig || undefined;

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
        financialSettings: payloadFinancial,
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

  const toggleCollectionForProduct = (collectionId: string) => {
    const current = item.data.collection_ids || [];
    let newIds;
    if (current.includes(collectionId)) {
        newIds = current.filter((id: string) => id !== collectionId);
    } else {
        newIds = [...current, collectionId];
    }
    updateSimple('collection_ids', newIds);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[1000] flex items-center justify-center p-4 md:p-12 overflow-y-auto">
      <div className="bg-white w-full max-w-7xl min-h-[90vh] rounded-[3.5rem] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 my-auto text-neutral-900">
        
        <header className="h-24 md:h-28 px-6 md:px-16 flex justify-between items-center border-b border-neutral-100 bg-white sticky top-0 z-[100]">
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-[0.5em] text-neutral-400">Omni Engine V19</span>
              <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">{item.type} Manager</h2>
            </div>
            <div className="hidden md:flex bg-neutral-100 p-1.5 rounded-2xl gap-1">
               <button onClick={() => setActiveTab('edit')} className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'bg-black text-white shadow-xl' : 'text-neutral-400 hover:text-black'}`}>
                  <Layout className="w-4 h-4 inline-block mr-2" /> Editor
               </button>
               {(item.type === 'product' || item.type === 'banner' || item.type === 'category' || item.type === 'collection') && (
                 <button onClick={() => setActiveTab('preview')} className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-black text-white shadow-xl' : 'text-neutral-400 hover:text-black'}`}>
                    <Eye className="w-4 h-4 inline-block mr-2" /> Live Preview
                 </button>
               )}
            </div>
            <div className="flex bg-neutral-100 p-1 rounded-xl gap-0.5">
              {(['pt', 'en', 'es', 'fr'] as Locale[]).map(lang => (
                <button key={lang} onClick={() => onLocaleChange(lang)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${item.editLocale === lang ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'}`}>{lang}</button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all text-neutral-900"><X className="w-6 h-6" /></button>
        </header>

        {activeTab === 'edit' ? (
          <div className="flex-1 overflow-y-auto p-8 md:p-16 no-scrollbar">
            
            {item.type === 'product' && (
              (() => {
                const productData = item.data as Product;
                return (
              <div className="space-y-12">
                <div className="flex gap-4 border-b border-neutral-100 pb-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'identity', label: 'Identidade & Variantes', icon: Layout },
                    { id: 'pricing', label: 'Matriz de Precificação', icon: TrendingUp },
                    { id: 'hotspots', label: 'Hotspots', icon: MousePointer2 }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setProductSubTab(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        productSubTab === tab.id 
                          ? 'bg-neutral-900 text-white shadow-lg translate-y-[1px]' 
                          : 'text-neutral-400 hover:text-black hover:bg-neutral-50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                </div>

                {productSubTab === 'identity' && (
                  <div className="space-y-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                      <div className="space-y-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Identidade ({item.editLocale})</label>
                          <input className="w-full p-8 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-3xl font-black outline-none focus:bg-white focus:border-black transition-all" value={getLocVal(productData.name)} onChange={e => updateNested('name', e.target.value)} placeholder="Nome do Produto" />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Descrição</label>
                          <textarea className="w-full p-8 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-sm font-medium min-h-[200px] outline-none focus:bg-white focus:border-black transition-all" value={getLocVal(productData.description)} onChange={e => updateNested('description', e.target.value)} placeholder="Descrição..." />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Categoria</label>
                              <select className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl font-black uppercase text-[11px] outline-none" value={productData.category_id || ''} onChange={e => updateSimple('category_id', e.target.value)}>
                                <option value="">Selecione...</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{getLocVal(cat.name)}</option>)}
                              </select>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Fornecedor *</label>
                                <select 
                                  className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl font-black uppercase text-[11px] outline-none focus:border-black transition-all" 
                                  value={productData.supplier_id || ''} 
                                  onChange={e => updateSimple('supplier_id', e.target.value)}
                                  required
                                >
                                  <option value="">Selecione um fornecedor...</option>
                                  {suppliers.filter(s => s.is_active).map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>{supplier.store_name}</option>
                                  ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Coleções</label>
                            <div className="max-h-32 overflow-y-auto bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-2 no-scrollbar">
                                {collections.map(col => {
                                    const isSelected = (productData.collection_ids || []).includes(col.id);
                                    return (
                                        <div key={col.id} onClick={() => toggleCollectionForProduct(col.id)} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-black text-white border-black' : 'bg-white hover:bg-neutral-100 border-transparent'}`}>
                                            <div className={`w-3 h-3 rounded-full border ${isSelected ? 'bg-white border-white' : 'border-neutral-300'}`} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest truncate">{getLocVal(col.name)}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-6 bg-neutral-50 border border-neutral-100 rounded-2xl">
                            <input
                            type="checkbox"
                            className="w-5 h-5 accent-black cursor-pointer"
                            checked={productData.has_free_shipping || false}
                            onChange={e => updateSimple('has_free_shipping', e.target.checked)}
                          />
                          <div className="flex-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-900 cursor-pointer">Frete Grátis</label>
                            <p className="text-[8px] text-neutral-400 mt-1">Ao ativar, R$35 será adicionado ao preço de varejo</p>
                          </div>
                        </div>
                        {/* Gender selection for products */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Gênero</label>
                          <select
                            className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl font-black uppercase text-[11px] outline-none focus:border-black transition-all"
                            value={productData.gender || Gender.FEMALE}
                            onChange={e => updateSimple('gender', e.target.value)}
                          >
                            <option value={Gender.FEMALE}>{t('gender.female')}</option>
                            <option value={Gender.MALE}>{t('gender.male')}</option>
                            <option value={Gender.UNISEX}>{t('gender.unisex')}</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-10">
                        <div className="bg-neutral-50 p-10 rounded-[2.5rem] border border-neutral-100">
                          <div className="flex justify-between items-center mb-10">
                          <div className="flex flex-col"><label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Galeria Master</label></div>
                            <label className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                                {uploading === 'master' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload
                                <input type="file" className="hidden" accept="image/*" onChange={handleMasterUpload} disabled={!!uploading} />
                            </label>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-8">
                            {(productData.base_images || []).map((img: string, i: number) => (
                              <div key={i} className="relative aspect-[3/4] bg-white rounded-xl overflow-hidden border border-neutral-200 group shadow-sm">
                                  <img src={img} className="w-full h-full object-cover" />
                                  <button onClick={() => { const newData = { ...productData, base_images: (productData.base_images || []).filter((_:any, idx:number) => idx !== i) }; onUpdateData(newData as unknown as AdminEditableData); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-10 border-t border-neutral-100 pt-10">
                      <div className="flex justify-between items-center">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-6"><Sliders className="w-8 h-8" /> SKUs & Variantes</h3>
                        <button onClick={addVariant} className="px-10 py-4 bg-black text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 hover:scale-105 transition-all"><Plus className="w-5 h-5" /> Novo SKU</button>
                      </div>

                      <div className="space-y-12">
                        {(productData.variants || []).map((v: ProductVariant, idx: number) => (
                          <div key={v.id || idx} className="bg-neutral-50 p-12 rounded-[4rem] border border-neutral-100 space-y-12 relative group animate-in slide-in-from-bottom-4">
                            <button onClick={() => onUpdateData({...productData, variants: (productData.variants || []).filter((_: any, i: number) => i !== idx)} as unknown as AdminEditableData)} className="absolute top-10 right-10 p-4 text-red-400 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-6 h-6" /></button>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
                              <div className="md:col-span-1 space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Imagem da Variante</label>
                                
                                {/* Current Image Preview */}
                                <div className="aspect-[3/4] bg-white rounded-3xl border border-neutral-200 relative overflow-hidden shadow-inner mb-4">
                                    {v.variant_images?.[0] ? (
                                      <img src={v.variant_images[0]} className="w-full h-full object-cover" /> 
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-neutral-200">
                                        <ImageIcon className="w-8 h-8 mb-2" />
                                        <span className="text-[8px] font-black uppercase">Sem Imagem</span>
                                      </div>
                                    )}
                                </div>

                                {/* Master Gallery Selection */}
                                <div>
                                  <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-300 mb-2 block">Selecionar da Galeria Master</span>
                                  {productData.base_images && productData.base_images.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-2">
                                      {productData.base_images.map((img: string, i: number) => (
                                        <button 
                                          key={i}
                                          onClick={() => handleSelectVariantImage(idx, img)}
                                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${v.variant_images?.[0] === img ? 'border-black opacity-100' : 'border-transparent opacity-50 hover:opacity-100 hover:border-neutral-200'}`}
                                        >
                                          <img src={img} className="w-full h-full object-cover" />
                                          {v.variant_images?.[0] === img && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                        </button>
                                      ))}
                                    </div>
                                      ) : (
                                    <p className="text-[8px] text-red-400 font-medium bg-red-50 p-2 rounded-lg">
                                      Nenhuma imagem na galeria master. Faça upload acima primeiro.
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="md:col-span-4 space-y-8">
                                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-3"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">SKU</label><input className="w-full p-5 bg-white border border-neutral-200 rounded-2xl font-mono text-xs font-bold" value={v.sku || ''} onChange={e => updateVariant(idx, 'sku', e.target.value)} /></div>
                                    <div className="space-y-3"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Tamanho</label><input className="w-full p-5 bg-white border border-neutral-200 rounded-2xl font-black text-xs uppercase" value={v.size || ''} onChange={e => updateVariant(idx, 'size', e.target.value)} /></div>
                                    <div className="space-y-3"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Cor ({item.editLocale})</label><input className="w-full p-5 bg-white border border-neutral-200 rounded-2xl text-xs font-bold" value={getLocVal(v.color_name)} onChange={e => updateVariantLocalized(idx, 'color_name', e.target.value)} /></div>
                                    
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Hex Cor</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" className="w-10 h-10 rounded-xl border-none cursor-pointer" value={v.color_hex || '#000000'} onChange={e => updateVariant(idx, 'color_hex', e.target.value)} />
                                            <input className="w-full p-5 bg-white border border-neutral-200 rounded-2xl font-mono text-xs font-bold uppercase" value={v.color_hex || ''} onChange={e => updateVariant(idx, 'color_hex', e.target.value)} placeholder="#000000" />
                                        </div>
                                    </div>

                                    <div className="space-y-3"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Estoque</label><input type="number" className="w-full p-5 bg-white border border-neutral-200 rounded-2xl font-mono text-xs font-bold" value={v.stock_quantity || 0} onChange={e => updateVariant(idx, 'stock_quantity', Number(e.target.value))} /></div>
                                 </div>

                                 {/* NEW SECTION: DADOS TÉCNICOS & GUIA */}
                                 <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4"><FileText className="w-5 h-5 text-neutral-400" /><h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Composição & Cuidados</h5></div>
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Composição ({item.editLocale})</label>
                                            <input className="w-full p-4 bg-neutral-50 rounded-xl text-xs font-medium border border-transparent focus:border-black outline-none transition-all" placeholder="Ex: 100% Algodão" value={getLocVal(v.composition)} onChange={e => updateVariantLocalized(idx, 'composition', e.target.value)} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Cuidados ({item.editLocale})</label>
                                            <textarea className="w-full p-4 bg-neutral-50 rounded-xl text-xs font-medium border border-transparent focus:border-black outline-none transition-all resize-none" placeholder="Ex: Lavar à mão..." rows={2} value={getLocVal(v.care_instructions)} onChange={e => updateVariantLocalized(idx, 'care_instructions', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4"><Ruler className="w-5 h-5 text-neutral-400" /><h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Guia de Medidas</h5></div>
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Selecionar Guia Global</label>
                                            <select 
                                              className="w-full p-4 bg-neutral-50 rounded-xl text-xs font-bold outline-none border border-neutral-100"
                                              value={v.size_guide_id || ''}
                                              onChange={(e) => updateVariant(idx, 'size_guide_id', e.target.value || null)}
                                            >
                                              <option value="">-- Sem Guia --</option>
                                              {sizeGuides.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                              ))}
                                            </select>
                                        </div>
                                        <div className="relative aspect-[3/2] bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200 overflow-hidden flex flex-col items-center justify-center">
                                            {v.size_guide_id ? (
                                                (() => {
                                                  const selectedGuide = sizeGuides.find(g => g.id === v.size_guide_id);
                                                  return selectedGuide ? (
                                                    <img src={selectedGuide.image_url} className="w-full h-full object-contain p-2" alt="Selected Guide" />
                                                  ) : (
                                                    <span className="text-[8px] text-red-400 font-bold uppercase">Guia não encontrado</span>
                                                  )
                                                })()
                                            ) : (
                                                <div className="text-center p-4 text-neutral-300">
                                                    <Ruler className="w-6 h-6 mx-auto mb-2" />
                                                    <span className="text-[8px] font-bold uppercase tracking-widest">Nenhum guia selecionado</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                 </div>

                                 <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                                    <div className="flex items-center gap-4 mb-6"><Scale className="w-5 h-5 text-neutral-400" /><h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Atributos & Custos</h5></div>
                                    <div className="grid grid-cols-3 gap-6">
                                       <div className="space-y-2"><label className="text-[8px] font-bold uppercase text-neutral-300">Custo (C_prod)</label><div className="relative"><DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" /><input type="number" className="w-full p-4 pl-10 bg-neutral-50 rounded-xl text-sm font-bold" value={v.cost_price || 0} onChange={e => updateVariant(idx, 'cost_price', Number(e.target.value))} /></div></div>
                                       <div className="space-y-2"><label className="text-[8px] font-bold uppercase text-neutral-300">Peso (g)</label><div className="relative"><Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" /><input type="number" className="w-full p-4 pl-10 bg-neutral-50 rounded-xl text-sm font-bold" value={v.weight_g || 0} onChange={e => updateVariant(idx, 'weight_g', Number(e.target.value))} /></div></div>
                                    </div>
                                 </div>

                                 {/* CORRELATED ASSETS SECTION */}
                                 <div className="bg-neutral-100/50 p-8 rounded-[2.5rem] border border-neutral-200">
                                    <div className="flex items-center gap-4 mb-6">
                                       <Link className="w-5 h-5 text-neutral-400" />
                                       <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Insumos & Ativos Vinculados (Obrigatórios na Venda)</h5>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                       {assets.map(asset => {
                                          const isLinked = (v.correlated_assets || []).find((l: any) => l.asset_id === asset.id);
                                          return (
                                             <button
                                                key={asset.id}
                                                onClick={() => handleToggleAsset(idx, asset.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${isLinked ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200 hover:border-black'}`}
                                             >
                                                <Package className="w-3 h-3" />
                                                {asset.name}
                                                {isLinked && <span className="ml-2 bg-white/20 px-1.5 rounded">x1</span>}
                                             </button>
                                          );
                                       })}
                                    </div>
                                 </div>

                                 {/* FACE SWAP SECTION */}
                                 <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200">
                                    <div className="flex items-center gap-4">
                                       <input
                                          type="checkbox"
                                          className="w-5 h-5 accent-purple-600 cursor-pointer"
                                          checked={v.face_swap_enabled || false}
                                          onChange={e => updateVariant(idx, 'face_swap_enabled', e.target.checked)}
                                       />
                                       <div className="flex-1">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 cursor-pointer">
                                             Face Swap (Experimentar Virtualmente)
                                          </label>
                                          <p className="text-[8px] text-purple-600 mt-1">
                                             Permite que clientes enviem uma foto para ver como ficariam usando este produto
                                          </p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {productSubTab === 'pricing' && (
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
                              <div className="bg-neutral-50 p-8 rounded-[3rem] border border-neutral-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                  <div className="space-y-3">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nome do Cenário</label>
                                      <input className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" value={activeScenario.name} onChange={e => updateScenario(activeScenario.id, 'name', e.target.value)} />
                                  </div>
                                  <div className="space-y-3">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Canal de Venda</label>
                                      <select className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none" value={activeScenario.channel} onChange={e => updateScenario(activeScenario.id, 'channel', e.target.value)}>
                                          <option value="ecommerce">E-commerce (D2C)</option>
                                          <option value="marketplace">Marketplace</option>
                                          <option value="wholesale">Atacado (B2B)</option>
                                      </select>
                                  </div>
                                  <div className="space-y-3">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Margem Alvo (%)</label>
                                      <div className="relative"><input type="number" className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" value={activeScenario.target_margin_percent} onChange={e => updateScenario(activeScenario.id, 'target_margin_percent', Number(e.target.value))} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-300">%</span></div>
                                  </div>
                                  <div className="space-y-3">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Custo Marketing (CAC)</label>
                                      <div className="relative"><DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-300" /><input type="number" className="w-full p-4 pl-10 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" value={activeScenario.ads_cac_target} onChange={e => updateScenario(activeScenario.id, 'ads_cac_target', Number(e.target.value))} /></div>
                                  </div>
                                  <div className="space-y-3">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Comissão (MktPlace)</label>
                                      <div className="relative"><input type="number" className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" value={activeScenario.commission_percent} onChange={e => updateScenario(activeScenario.id, 'commission_percent', Number(e.target.value))} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-300">%</span></div>
                                  </div>
                              </div>

                              {/* 3. INFO BADGES & ACTIONS */}
                              <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3 flex-wrap">
                                      <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                                          <Landmark className="w-3 h-3 text-emerald-600" />
                                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">MEI - DAS Fixo R$71,60/mes</span>
                                      </div>
                                      {productData.has_free_shipping && (
                                          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                                              <Truck className="w-3 h-3 text-blue-600" />
                                              <span className="text-[9px] font-black uppercase tracking-widest text-blue-700">Frete Gratis (+R$35 no preco)</span>
                                          </div>
                                      )}
                                  </div>
                                  <button onClick={calculateMatrix} className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3">
                                      <Calculator className="w-4 h-4" /> Calcular Matriz
                                  </button>
                              </div>

                              {/* 4. RESULTS TABLE */}
                              {Object.keys(simulationResults).length > 0 && (
                                  <div className="bg-white border border-neutral-200 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
                                      
                                      {/* Target Selector Bar */}
                                      <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                                          <div className="flex items-center gap-4">
                                              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Atrelar sugestão à variável:</span>
                                              <div className="relative">
                                                  <select 
                                                      value={targetPriceField}
                                                      onChange={(e) => setTargetPriceField(e.target.value as any)}
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
                                                      <tr key={v.id} className={`transition-colors ${selectedVariantsForUpdate.has(v.id) ? 'bg-blue-50/20' : 'hover:bg-neutral-50/50'}`}>
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
                                                                  <span className="text-xs font-bold">{formatCurrency(result.breakdown.production + result.breakdown.assets, locale)}</span>
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
                                      {historyVariantId && (
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
                                              onClick={() => {
                                                setHistoryVariantId(null);
                                                setHistoryEntries(null);
                                              }}
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
                                      )}
                                  </div>
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
                )}

                {productSubTab === 'hotspots' && (
                  <HotspotsEditor
                    product={productData}
                    products={products}
                    locale={locale}
                  />
                )}
              </div>
                );
              })()
            )}

            {/* BANNERS EDITOR */}
            {item.type === 'banner' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Título do Banner ({item.editLocale})</label>
                        <textarea className="w-full p-8 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-2xl font-black outline-none focus:bg-white focus:border-black transition-all whitespace-pre-line" value={getLocVal(item.data.title)} onChange={e => updateNested('title', e.target.value)} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Imagem ({item.editLocale})</label>
                            <div className="relative aspect-video bg-neutral-50 rounded-[2rem] border border-neutral-100 overflow-hidden group">
                                {getLocVal(item.data.image_url) ? (
                                    <img src={getLocVal(item.data.image_url)} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-neutral-300" /></div>
                                )}
                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                                    <span className="px-6 py-3 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleGenericUpload(e)} disabled={!!uploading} />
                                </label>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-3"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Posição</label><input className="w-full p-5 bg-white border border-neutral-200 rounded-2xl text-xs font-bold" value={item.data.position || 'hero_main'} onChange={e => updateSimple('position', e.target.value)} /></div>
                            <div className="space-y-3"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Ordem</label><input type="number" className="w-full p-5 bg-white border border-neutral-200 rounded-2xl text-xs font-bold" value={item.data.sort_order || 0} onChange={e => updateSimple('sort_order', Number(e.target.value))} /></div>
                            <div className="flex items-center gap-4 p-5 bg-white border border-neutral-200 rounded-2xl"><input type="checkbox" className="w-5 h-5 accent-black" checked={item.data.is_active} onChange={e => updateSimple('is_active', e.target.checked)} /><span className="text-xs font-black uppercase tracking-widest">Ativo</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* CATEGORY & COLLECTION EDITOR */}
            {(item.type === 'category' || item.type === 'collection') && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Nome ({item.editLocale})</label>
                        <input className="w-full p-8 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-2xl font-black outline-none focus:bg-white focus:border-black transition-all" value={getLocVal(item.data.name)} onChange={e => updateNested('name', e.target.value)} />
                    </div>
                    
                    {item.type === 'collection' && (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Descrição ({item.editLocale})</label>
                            <textarea className="w-full p-8 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-sm font-medium min-h-[150px] outline-none focus:bg-white focus:border-black transition-all" value={getLocVal(item.data.description)} onChange={e => updateNested('description', e.target.value)} />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Imagem de Capa</label>
                            <div className="relative aspect-video bg-neutral-50 rounded-[2rem] border border-neutral-100 overflow-hidden group">
                                {item.data.image_url ? (
                                    <img src={item.data.image_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-neutral-300" /></div>
                                )}
                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                                    <span className="px-6 py-3 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleGenericUpload(e, 'image_url')} disabled={!!uploading} />
                                </label>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-3"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Slug (URL)</label><input className="w-full p-5 bg-white border border-neutral-200 rounded-2xl text-xs font-bold" value={item.data.slug || ''} onChange={e => updateSimple('slug', e.target.value)} /></div>
                            <div className="flex items-center gap-4 p-5 bg-white border border-neutral-200 rounded-2xl"><input type="checkbox" className="w-5 h-5 accent-black" checked={item.data.is_active} onChange={e => updateSimple('is_active', e.target.checked)} /><span className="text-xs font-black uppercase tracking-widest">Ativo</span></div>
                        </div>
                    </div>

                    {/* CATEGORY-ONLY: Icon and Gender */}
                    {item.type === 'category' && (
                      <div className="space-y-6 pt-4 border-t border-neutral-100">
                        <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Ícone da Categoria</label>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {/* No icon option */}
                            <button
                              type="button"
                              onClick={() => updateSimple('icon', null)}
                              className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${
                                !(item.data as Category).icon
                                  ? 'border-black bg-black text-white'
                                  : 'border-neutral-200 bg-white text-neutral-400 hover:border-neutral-300'
                              }`}
                            >
                              <X className="w-5 h-5" />
                              <span className="text-[8px] font-bold">Nenhum</span>
                            </button>
                            {/* Icon options */}
                            {CATEGORY_ICONS.map(({ name, icon: Icon, label }) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => updateSimple('icon', name)}
                                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${
                                  (item.data as Category).icon === name
                                    ? 'border-black bg-black text-white'
                                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                                <span className="text-[8px] font-bold truncate px-1">{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
            )}
            
          </div>
        ) : (
           <div className="flex-1 overflow-y-auto no-scrollbar relative bg-white">
              <div className="absolute top-4 right-4 z-50 bg-black/80 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md flex items-center gap-2"><Monitor className="w-3 h-3" /> Live Preview Mode</div>
              
              {item.type === 'product' && <div className="min-h-full"><ProductDetail product={item.data} userMode={UserMode.VAREJO} onAddToCart={() => alert("Preview Mode")} onBack={() => {}} isWishlisted={false} onToggleWishlist={() => {}} t={t} locale={locale} currentUser={null} sizeGuides={sizeGuides} /></div>}
              {item.type === 'banner' && <div className="h-full"><Hero banners={[item.data]} t={t} locale={locale} onNavigate={() => {}} /></div>}
              
              {item.type === 'collection' && (
                 <div className="min-h-full">
                    <CollectionDetail 
                       collection={item.data}
                       products={products}
                       categories={categories}
                       userMode={UserMode.VAREJO}
                       onSelectProduct={() => {}}
                       wishlistIds={[]}
                       onToggleWishlist={() => {}}
                       onBack={() => {}}
                       locale={locale}
                    />
                 </div>
              )}

              {item.type === 'category' && (
                 <div className="min-h-full">
                    <CollectionDetail 
                       collection={{
                           ...item.data,
                           description: { pt: 'Categoria', en: 'Category', es: 'Categoría', fr: 'Catégorie' } 
                       } as any}
                       products={products.map(p => p.category_id === item.data.id ? { ...p, collection_ids: [...(p.collection_ids || []), item.data.id] } : p)}
                       categories={categories}
                       userMode={UserMode.VAREJO}
                       onSelectProduct={() => {}}
                       wishlistIds={[]}
                       onToggleWishlist={() => {}}
                       onBack={() => {}}
                       locale={locale}
                    />
                 </div>
              )}
           </div>
        )}

        <footer className="h-28 md:h-32 px-6 md:px-16 border-t border-neutral-100 flex items-center justify-end gap-3 md:gap-6 bg-white sticky bottom-0 z-[100]">
          {_onDelete && (item.type === 'category' || item.type === 'collection') && (item.data as any)?.id && (
            <button
              onClick={() => _onDelete(String((item.data as any).id))}
              className="px-10 md:px-12 py-4 md:py-6 border border-red-200 text-red-600 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2 md:gap-3"
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          )}
          <button onClick={onClose} className="px-6 md:px-12 py-4 md:py-6 border border-neutral-200 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all">Descartar</button>
          <button onClick={onSave} className="px-10 md:px-16 py-4 md:py-6 bg-black text-white rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] shadow-2xl hover:scale-[1.02] transition-all flex items-center gap-2 md:gap-4"><Save className="w-4 h-4 md:w-5 md:h-5" /> Sincronizar Tudo</button>
        </footer>
      </div>
    </div>
  );
};

export default AdminEditorModal;
