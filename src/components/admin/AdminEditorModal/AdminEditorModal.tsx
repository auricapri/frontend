import React from 'react';
import { X, Save, Trash2, Layout, Eye, TrendingUp, MousePointer2 } from 'lucide-react';
import { Locale } from '../../../i18n';
import { Product } from '../../../types';
import { HotspotsEditor } from '../HotspotsEditor';

// Types
import { AdminEditorModalProps, ProductSubTab } from './types';

// Hooks
import { useEditorState, useProductHandlers } from './hooks';

// Utils
import { getLocVal, createUpdateNested, createUpdateSimple } from './utils';

// Tabs
import {
  ProductIdentityTab,
  ProductPricingTab,
  BannerEditor,
  CategoryCollectionEditor,
  PreviewTab
} from './tabs';

const AdminEditorModal: React.FC<AdminEditorModalProps> = ({
  item,
  categories,
  collections = [],
  products = [],
  assets = [],
  sizeGuides = [],
  suppliers = [],
  onClose,
  onSave,
  onUpdateData,
  onLocaleChange,
  onCloneLocale: _onCloneLocale,
  onDelete: _onDelete,
  globalConfig,
  t,
  locale,
}) => {
  // State management hook
  const editorState = useEditorState({
    item,
    products,
    assets,
    globalConfig,
    onUpdateData,
  });

  // Product handlers hook
  const productHandlers = useProductHandlers({
    item,
    onUpdateData,
    setUploading: editorState.setUploading,
  });

  // Utility functions bound to current locale
  const getLocValBound = (obj: any) => getLocVal(obj, item.editLocale);
  const updateNested = createUpdateNested(item.data, item.editLocale, onUpdateData);
  const updateSimple = createUpdateSimple(item.data, onUpdateData);

  const productData = item.type === 'product' ? item.data as Product : null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[1000] flex items-center justify-center p-4 md:p-12 overflow-y-auto">
      <div className="bg-white w-full max-w-7xl min-h-[90vh] rounded-[3.5rem] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 my-auto text-neutral-900">

        {/* Header */}
        <header className="h-24 md:h-28 px-6 md:px-16 flex justify-between items-center border-b border-neutral-100 bg-white sticky top-0 z-[100]">
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-[0.5em] text-neutral-400">Omni Engine V19</span>
              <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">{item.type} Manager</h2>
            </div>
            <div className="hidden md:flex bg-neutral-100 p-1.5 rounded-2xl gap-1">
              <button
                onClick={() => editorState.setActiveTab('edit')}
                className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  editorState.activeTab === 'edit' ? 'bg-black text-white shadow-xl' : 'text-neutral-400 hover:text-black'
                }`}
              >
                <Layout className="w-4 h-4 inline-block mr-2" /> Editor
              </button>
              {(item.type === 'product' || item.type === 'banner' || item.type === 'category' || item.type === 'collection') && (
                <button
                  onClick={() => editorState.setActiveTab('preview')}
                  className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    editorState.activeTab === 'preview' ? 'bg-black text-white shadow-xl' : 'text-neutral-400 hover:text-black'
                  }`}
                >
                  <Eye className="w-4 h-4 inline-block mr-2" /> Live Preview
                </button>
              )}
            </div>
            <div className="flex bg-neutral-100 p-1 rounded-xl gap-0.5">
              {(['pt', 'en', 'es', 'fr'] as Locale[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => onLocaleChange(lang)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    item.editLocale === lang ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-4 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all text-neutral-900"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Content */}
        {editorState.activeTab === 'edit' ? (
          <div className="flex-1 overflow-y-auto p-8 md:p-16 no-scrollbar">

            {/* Product Editor */}
            {item.type === 'product' && productData && (
              <div className="space-y-12">
                {/* Product Sub-tabs */}
                <div className="flex gap-4 border-b border-neutral-100 pb-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'identity' as ProductSubTab, label: 'Identidade & Variantes', icon: Layout },
                    { id: 'pricing' as ProductSubTab, label: 'Matriz de Precificação', icon: TrendingUp },
                    { id: 'hotspots' as ProductSubTab, label: 'Hotspots', icon: MousePointer2 }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => editorState.setProductSubTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        editorState.productSubTab === tab.id
                          ? 'bg-neutral-900 text-white shadow-lg translate-y-[1px]'
                          : 'text-neutral-400 hover:text-black hover:bg-neutral-50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                </div>

                {editorState.productSubTab === 'identity' && (
                  <ProductIdentityTab
                    productData={productData}
                    categories={categories}
                    collections={collections}
                    suppliers={suppliers}
                    assets={assets}
                    sizeGuides={sizeGuides}
                    editLocale={item.editLocale}
                    uploading={editorState.uploading}
                    getLocVal={getLocValBound}
                    updateNested={updateNested}
                    updateSimple={updateSimple}
                    onMasterUpload={productHandlers.handleMasterUpload}
                    onSelectVariantImage={productHandlers.handleSelectVariantImage}
                    updateVariant={productHandlers.updateVariant}
                    updateVariantLocalized={productHandlers.updateVariantLocalized}
                    onToggleAsset={productHandlers.handleToggleAsset}
                    addVariant={productHandlers.addVariant}
                    removeVariant={productHandlers.removeVariant}
                    removeBaseImage={productHandlers.removeBaseImage}
                    toggleCollectionForProduct={productHandlers.toggleCollectionForProduct}
                    t={t}
                  />
                )}

                {editorState.productSubTab === 'pricing' && (
                  <ProductPricingTab
                    productData={productData}
                    activeScenario={editorState.activeScenario}
                    activeScenarioId={editorState.activeScenarioId}
                    simulationResults={editorState.simulationResults}
                    targetPriceField={editorState.targetPriceField}
                    selectedVariantsForUpdate={editorState.selectedVariantsForUpdate}
                    historyVariantId={editorState.historyVariantId}
                    historyVariant={editorState.historyVariant}
                    historyEntries={editorState.historyEntries}
                    historyLoading={editorState.historyLoading}
                    locale={locale}
                    getLocVal={getLocValBound}
                    setActiveScenarioId={editorState.setActiveScenarioId}
                    setTargetPriceField={editorState.setTargetPriceField}
                    handleAddScenario={editorState.handleAddScenario}
                    updateScenario={editorState.updateScenario}
                    calculateMatrix={editorState.calculateMatrix}
                    openPriceHistory={editorState.openPriceHistory}
                    closePriceHistory={editorState.closePriceHistory}
                    toggleSelectAll={editorState.toggleSelectAll}
                    toggleVariantSelection={editorState.toggleVariantSelection}
                    applyPricesToSelected={editorState.applyPricesToSelected}
                  />
                )}

                {editorState.productSubTab === 'hotspots' && (
                  <HotspotsEditor
                    product={productData}
                    products={products}
                    locale={locale}
                  />
                )}
              </div>
            )}

            {/* Banner Editor */}
            {item.type === 'banner' && (
              <BannerEditor
                data={item.data}
                editLocale={item.editLocale}
                uploading={editorState.uploading}
                getLocVal={getLocValBound}
                updateNested={updateNested}
                updateSimple={updateSimple}
                onUpload={(e) => productHandlers.handleGenericUpload(e, 'image_url', updateNested, updateSimple)}
              />
            )}

            {/* Category & Collection Editor */}
            {(item.type === 'category' || item.type === 'collection') && (
              <CategoryCollectionEditor
                type={item.type as 'category' | 'collection'}
                data={item.data}
                editLocale={item.editLocale}
                uploading={editorState.uploading}
                getLocVal={getLocValBound}
                updateNested={updateNested}
                updateSimple={updateSimple}
                onUpload={(e, field) => productHandlers.handleGenericUpload(e, field, updateNested, updateSimple)}
              />
            )}

          </div>
        ) : (
          <PreviewTab
            type={item.type}
            data={item.data}
            products={products}
            categories={categories}
            sizeGuides={sizeGuides}
            t={t}
            locale={locale}
          />
        )}

        {/* Footer */}
        <footer className="h-28 md:h-32 px-6 md:px-16 border-t border-neutral-100 flex items-center justify-end gap-3 md:gap-6 bg-white sticky bottom-0 z-[100]">
          {_onDelete && (item.type === 'category' || item.type === 'collection') && (item.data as any)?.id && (
            <button
              onClick={() => _onDelete(String((item.data as any).id))}
              className="px-10 md:px-12 py-4 md:py-6 border border-red-200 text-red-600 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2 md:gap-3"
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 md:px-12 py-4 md:py-6 border border-neutral-200 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all"
          >
            Descartar
          </button>
          <button
            onClick={onSave}
            className="px-10 md:px-16 py-4 md:py-6 bg-black text-white rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] shadow-2xl hover:scale-[1.02] transition-all flex items-center gap-2 md:gap-4"
          >
            <Save className="w-4 h-4 md:w-5 md:h-5" /> Sincronizar Tudo
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AdminEditorModal;
