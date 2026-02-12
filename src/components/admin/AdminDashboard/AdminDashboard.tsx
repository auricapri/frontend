/// Admin Dashboard
/// Main admin dashboard component

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAdminRouter, AdminTab } from '../../../hooks/useAdminRouter';
import { useAdminData } from '../../../hooks/useAdminData';
import { GlobalFinancialSettings, Coupon } from '../../../types';
import { Locale } from '../../../i18n';
import { AdminDashboardProps, MarketingSubTab } from './types';
import { AdminSidebar, DeleteConfirmationModal } from './components';
import {
  useSidebarCategories,
  useEditorState,
  useDeleteConfirm,
  useAdminHandlers,
} from './hooks';

// Lazy load admin tabs
const AdminHealth = React.lazy(() => import('../AdminHealth'));
const AdminInventory = React.lazy(() => import('../AdminInventory'));
const AdminOrders = React.lazy(() => import('../AdminOrders'));
const AdminTaxonomy = React.lazy(() => import('../AdminTaxonomy'));
const AdminMarketing = React.lazy(() => import('../AdminMarketing'));
const AdminAssets = React.lazy(() => import('../AdminAssets'));
const AdminCoupons = React.lazy(() => import('../AdminCoupons'));
const AdminUsers = React.lazy(() => import('../AdminUsers'));
const AdminSystem = React.lazy(() => import('../AdminSystem'));
const AdminAboutUs = React.lazy(() => import('../AdminAboutUs'));
const AdminGuides = React.lazy(() => import('../AdminGuides'));
const AdminFAQ = React.lazy(() => import('../AdminFAQ'));
const AdminDreamBoard = React.lazy(() => import('../AdminDreamBoard'));
const AdminSuppliers = React.lazy(() => import('../AdminSuppliers'));
const AdminDelivery = React.lazy(() => import('../AdminDelivery'));
const AdminMarketplaces = React.lazy(() => import('../AdminMarketplaces'));
const AdminGarmentGallery = React.lazy(() => import('../AdminGarmentGallery'));
const FinancialDashboard = React.lazy(() => import('../FinancialDashboard'));
const AdminEditorModal = React.lazy(() => import('../AdminEditorModal'));
const AdminCouponEditor = React.lazy(() => import('../AdminCouponEditor'));
const AdminSupplierEditor = React.lazy(() => import('../AdminSupplierEditor'));
const AdminCampaignEditor = React.lazy(() => import('../AdminCampaignEditor'));

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  t,
  locale,
  onProductChange,
}) => {
  const { activeTab, navigate } = useAdminRouter();
  const {
    products, categories, collections, banners, coupons, campaigns,
    assets, orders, users, sizeGuides, suppliers, config,
    isLoading, fetchData,
    setProducts, setCategories, setCollections, setBanners, setCoupons,
    setAssets, setOrders, setConfig, setSizeGuides, setSuppliers
  } = useAdminData(activeTab);

  const [marketingSubTab, setMarketingSubTab] = useState<MarketingSubTab>('banners');
  const [editLocale, setEditLocale] = useState<Locale>(locale);

  const { expandedCategories, toggleCategory } = useSidebarCategories();

  const editorState = useEditorState();
  const {
    editingItem, setEditingItem,
    editingCoupon, setEditingCoupon,
    editingSupplier, showSupplierEditor,
    editingCampaign, showCampaignEditor,
    isDeletingTaxonomy, setIsDeletingTaxonomy,
    openProductEditor, openCategoryEditor, openCollectionEditor, openBannerEditor,
    openSupplierEditor, closeSupplierEditor,
    openCampaignEditor, closeCampaignEditor,
    openCouponEditor,
  } = editorState;

  const deleteConfirmHook = useDeleteConfirm({
    products,
    locale,
    onRefresh: fetchData,
    onProductChange,
  });

  const handlers = useAdminHandlers({
    editingItem,
    setEditingItem,
    setEditingCoupon,
    setOrders,
    setConfig,
    config,
    fetchData,
    onProductChange,
    locale,
    isDeletingTaxonomy,
    setIsDeletingTaxonomy,
  });

  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
    </div>
  );

  const ModalLoadingFallback = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-neutral-100 font-sans text-neutral-900">
      <AdminSidebar
        activeTab={activeTab}
        onNavigate={navigate}
        onLogout={onLogout}
        expandedCategories={expandedCategories}
        onToggleCategory={toggleCategory}
      />

      <main className="flex-1 overflow-hidden relative flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 md:p-12 min-h-0">
            <React.Suspense fallback={<LoadingFallback />}>
              {activeTab === 'health' && (
                <AdminHealth
                  products={products}
                  assets={assets}
                  orders={orders}
                  financials={config.financial_settings || {} as GlobalFinancialSettings}
                  locale={locale}
                />
              )}
              {activeTab === 'dream' && (
                <AdminDreamBoard
                  categories={categories}
                  collections={collections}
                  assets={assets}
                  locale={locale}
                />
              )}
              {activeTab === 'inventory' && (
                <AdminInventory
                  products={products}
                  suppliers={suppliers}
                  onEdit={openProductEditor}
                  onDelete={deleteConfirmHook.requestDelete}
                  onAdd={() => openProductEditor()}
                  locale={locale}
                />
              )}
              {activeTab === 'suppliers' && (
                <AdminSuppliers
                  suppliers={suppliers}
                  onEdit={(s) => openSupplierEditor(s)}
                  onDelete={handlers.handleDeleteSupplier}
                  onAdd={() => openSupplierEditor(null)}
                />
              )}
              {activeTab === 'orders' && (
                <AdminOrders
                  orders={orders}
                  products={products}
                  assets={assets}
                  onUpdateStatus={handlers.handleUpdateOrderStatus}
                  locale={locale}
                />
              )}
              {activeTab === 'delivery' && (
                <AdminDelivery orders={orders} suppliers={suppliers} locale={locale} />
              )}
              {activeTab === 'marketplaces' && <AdminMarketplaces locale={locale} />}
              {activeTab === 'financial' && <FinancialDashboard />}
              {activeTab === 'taxonomy' && (
                <AdminTaxonomy
                  categories={categories}
                  collections={collections}
                  onEditCategory={openCategoryEditor}
                  onEditCollection={openCollectionEditor}
                  onAddCategory={() => openCategoryEditor()}
                  onAddCollection={() => openCollectionEditor()}
                  locale={locale}
                />
              )}
              {activeTab === 'guides' && (
                <AdminGuides
                  guides={sizeGuides}
                  onAdd={(g) => setSizeGuides(prev => [...prev, g])}
                  onUpdate={(g) => setSizeGuides(prev => prev.map(item => item.id === g.id ? g : item))}
                  onDelete={(id) => setSizeGuides(prev => prev.filter(item => item.id !== id))}
                />
              )}
              {activeTab === 'garment-gallery' && <AdminGarmentGallery />}
              {activeTab === 'marketing' && (
                <AdminMarketing
                  banners={banners}
                  campaigns={campaigns}
                  onEdit={openBannerEditor}
                  onRefresh={fetchData}
                  locale={locale}
                  activeTab={marketingSubTab}
                  onTabChange={setMarketingSubTab}
                  onAddCampaign={() => openCampaignEditor(null)}
                  onEditCampaign={openCampaignEditor}
                />
              )}
              {activeTab === 'coupons' && (
                <AdminCoupons
                  coupons={coupons}
                  onAdd={() => openCouponEditor()}
                  onEdit={setEditingCoupon}
                />
              )}
              {activeTab === 'assets' && (
                <AdminAssets
                  assets={assets}
                  onAdd={async (a) => { await import('../../../api/instances').then(m => m.assetsApi.create(a)); fetchData(); }}
                  onUpdate={async (a) => { await import('../../../api/instances').then(m => m.assetsApi.update(a.id, a)); fetchData(); }}
                  onDelete={async (id) => { await import('../../../api/instances').then(m => m.assetsApi.delete(id)); fetchData(); }}
                  locale={locale}
                />
              )}
              {activeTab === 'about' && (
                <AdminAboutUs
                  config={config}
                  onChange={setConfig}
                  onSave={handlers.handleSystemSave}
                  locale={editLocale}
                  onLocaleChange={setEditLocale}
                />
              )}
              {activeTab === 'faq' && <AdminFAQ locale={locale} />}
              {activeTab === 'users' && <AdminUsers users={users} />}
              {activeTab === 'system' && (
                <AdminSystem
                  config={config}
                  onChange={setConfig}
                  onSave={handlers.handleSystemSave}
                  isLoading={false}
                  editLocale={editLocale}
                  onLocaleChange={setEditLocale}
                />
              )}
            </React.Suspense>
          </div>
        )}
      </main>

      {/* Modals */}
      {editingItem && (
        <React.Suspense fallback={<ModalLoadingFallback />}>
          <AdminEditorModal
            item={{ ...editingItem, editLocale }}
            categories={categories}
            collections={collections}
            products={products}
            assets={assets}
            sizeGuides={sizeGuides}
            suppliers={suppliers}
            globalConfig={config.financial_settings}
            onClose={() => setEditingItem(null)}
            onSave={handlers.handleSaveItem}
            onUpdateData={(newData) => setEditingItem({ ...editingItem, data: newData })}
            onLocaleChange={setEditLocale}
            onCloneLocale={() => {}}
            onDelete={() => handlers.requestDeleteTaxonomy()}
            t={t}
            locale={locale}
          />
        </React.Suspense>
      )}

      {editingCoupon && (
        <React.Suspense fallback={<ModalLoadingFallback />}>
          <AdminCouponEditor
            coupon={editingCoupon}
            products={products}
            financials={config.financial_settings || {} as GlobalFinancialSettings}
            onClose={() => setEditingCoupon(null)}
            onSave={handlers.handleSaveCoupon}
            onDelete={handlers.handleDeleteCoupon}
            locale={locale}
          />
        </React.Suspense>
      )}

      {showSupplierEditor && (
        <React.Suspense fallback={<ModalLoadingFallback />}>
          <AdminSupplierEditor
            supplier={editingSupplier}
            onClose={closeSupplierEditor}
            onSave={async (data) => {
              await handlers.handleSaveSupplier(data, editingSupplier?.id);
              closeSupplierEditor();
            }}
          />
        </React.Suspense>
      )}

      {showCampaignEditor && (
        <React.Suspense fallback={<ModalLoadingFallback />}>
          <AdminCampaignEditor
            campaign={editingCampaign}
            onClose={closeCampaignEditor}
            onSave={async (data) => {
              await handlers.handleSaveCampaign(data);
              closeCampaignEditor();
            }}
            onDelete={handlers.handleDeleteCampaign}
          />
        </React.Suspense>
      )}

      {deleteConfirmHook.deleteConfirm && (
        <DeleteConfirmationModal
          deleteConfirm={deleteConfirmHook.deleteConfirm}
          deleteQueue={deleteConfirmHook.deleteQueue}
          confirmationText={deleteConfirmHook.confirmationText}
          isDeleting={deleteConfirmHook.isDeleting}
          onConfirmationTextChange={deleteConfirmHook.setConfirmationText}
          onConfirm={deleteConfirmHook.confirmDelete}
          onCancel={deleteConfirmHook.cancelDelete}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
