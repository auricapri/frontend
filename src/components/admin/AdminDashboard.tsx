
import React, { useState, useCallback } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { useAdminHandlers } from '../../hooks/useAdminHandlers';
import { 
  LayoutDashboard, Box, Users, Settings, LogOut, 
  BarChart3, Tag, Layers, Image as ImageIcon, Ticket, Archive, BookOpen, Ruler, Lightbulb,
  AlertTriangle, X, Loader2, Store, Truck
} from 'lucide-react';
// Supabase is only used for auth.signOut() which is safe
import { supabase } from '../../utils/supabase';
import { ProductsApi } from '../../api/products.api';
import { OrdersApi } from '../../api/orders.api';
import { UsersApi } from '../../api/users.api';
import { StoreApi } from '../../api/store.api';
import { CouponsApi } from '../../api/coupons.api';
import { CollectionsApi } from '../../api/collections.api';
import { AssetsApi } from '../../api/assets.api';
import { GuidesApi } from '../../api/guides.api';
import { BannersApi } from '../../api/banners.api';
import { SuppliersApi } from '../../api/suppliers.api';
import { Locale } from '../../i18n';
import { 
  Product, Category, Collection, Banner, Coupon, Asset, 
  StoreConfig, UserProfile, Order, GlobalFinancialSettings, SizeGuide, Supplier
} from '../../types';

import AdminHealth from './AdminHealth';
import AdminInventory from './AdminInventory';
import AdminOrders from './AdminOrders';
import AdminTaxonomy from './AdminTaxonomy';
import AdminMarketing from './AdminMarketing';
import AdminAssets from './AdminAssets';
import AdminCoupons from './AdminCoupons';
import AdminUsers from './AdminUsers';
import AdminSystem from './AdminSystem';
import AdminAboutUs from './AdminAboutUs';
import AdminGuides from './AdminGuides';
import AdminEditorModal from './AdminEditorModal';
import AdminCouponEditor from './AdminCouponEditor';
import AdminDreamBoard from './AdminDreamBoard';
import AdminSuppliers from './AdminSuppliers';
import AdminSupplierEditor from './AdminSupplierEditor';
import AdminDelivery from './AdminDelivery';

interface AdminDashboardProps {
  onLogout: () => void;
  t: (key: string) => string;
  locale: Locale;
  onProductChange: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, t, locale, onProductChange }) => {
  const [activeTab, setActiveTab] = useState('health');
  const [isLoading, setIsLoading] = useState(true);
  const [editLocale, setEditLocale] = useState<Locale>(locale);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [config, setConfig] = useState<StoreConfig>({
    brand_name: '',
    about_us: { pt: '', en: '' },
    about_us_image: '',
    terms_of_service: { pt: '', en: '' },
    privacy_policy: { pt: '', en: '' },
    financial_settings: {
      fixed_monthly: 0,
      infra_tech: 0,
      monthly_sales_vol: 0,
      das_mei: 0,
      marketing_fixed: 0,
      packaging_cost: 0,
      avg_freight_cost: 0
    }
  });

  // Editor State
  const [editingItem, setEditingItem] = useState<{ type: string; data: unknown } | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showSupplierEditor, setShowSupplierEditor] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ productIds: string[]; productNames: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteQueue, setDeleteQueue] = useState<Array<{ id: string; status: 'pending' | 'processing' | 'success' | 'failed'; error?: string }>>([]);
  const [confirmationText, setConfirmationText] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const productsApi = new ProductsApi();
      const ordersApi = new OrdersApi();
      const usersApi = new UsersApi();
      const storeApi = new StoreApi();
      const couponsApi = new CouponsApi();
      const collectionsApi = new CollectionsApi();
      const assetsApi = new AssetsApi();
      const guidesApi = new GuidesApi();
      const bannersApi = new BannersApi();
      const suppliersApi = new SuppliersApi();

      const [
        productsData,
        categoriesData,
        collectionsData,
        bannersData,
        couponsData,
        assetsData,
        ordersData,
        usersData,
        configData,
        guidesData,
        suppliersData
      ] = await Promise.all([
        productsApi.getAll(),
        storeApi.getAllCategories(),
        collectionsApi.getAll(),
        bannersApi.getAll(),
        couponsApi.getAll(),
        assetsApi.getAll(),
        ordersApi.getAllAdmin(),
        usersApi.getAll(),
        storeApi.getConfig(),
        guidesApi.getAll(),
        suppliersApi.getAll()
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setCollections(collectionsData);
      setBanners(bannersData);
      setCoupons(couponsData);
      setAssets(assetsData);
      setOrders(ordersData);
      setUsers(usersData);
      if (configData) setConfig(configData);
      setSizeGuides(guidesData);
      setSuppliers(suppliersData);

    } catch (e) {
      console.error("Admin Fetch Error", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateOrderStatus = async (orderId: string, status: string, trackingCode?: string) => {
    try {
      const ordersApi = new OrdersApi();
      const updatedOrder = await ordersApi.updateStatus(orderId, status, trackingCode);
      
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar pedido';
      alert(message);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { type, data } = editingItem;
      
      const payload = { ...data };
      const variants = payload.variants;
      delete payload.variants; // Variants handled separately

      if (type === 'product') {
        const productsApi = new ProductsApi();
        
        if (data.id) {
          let updateResult;
          try {
            updateResult = await productsApi.update(data.id, { ...payload, variants });
          } catch (updateError: unknown) {
            throw updateError;
          }
        } else {
          await productsApi.create({ ...payload, variants });
        }
      } else if (type === 'collection') {
        const collectionsApi = new CollectionsApi();
        if (data.id) {
          await collectionsApi.update(data.id, payload);
        } else {
          await collectionsApi.create(payload);
        }
      } else if (type === 'banner') {
        const bannersApi = new BannersApi();
        if (data.id) {
          await bannersApi.update(data.id, payload);
        } else {
          await bannersApi.create(payload);
        }
      }

      await fetchData();
      onProductChange();
      setEditingItem(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar pedido';
      alert(message);
    }
  };

  const handleSaveCoupon = async (coupon: Coupon) => {
    try {
      const couponsApi = new CouponsApi();
      if (coupon.id) {
        await couponsApi.update(coupon.id, coupon);
      } else {
        await couponsApi.create(coupon);
      }
      fetchData();
      setEditingCoupon(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar cupom';
      alert(message);
    }
  };

  const handleSystemSave = async () => {
     try {
       const storeApi = new StoreApi();
       await storeApi.updateConfig(config);
       alert("Configurações salvas!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar';
      alert(message);
    }
  };

  const getLoc = (obj: unknown): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      return obj[locale] || obj['pt'] || obj['en'] || '';
    }
    return String(obj);
  };

  const handleDeleteProduct = async (productIds: string[]) => {
    if (productIds.length === 0) return;
    
    const selectedProducts = products.filter(p => productIds.includes(p.id));
    const productNames = selectedProducts.map(p => getLoc(p.name) || 'Produto sem nome');
    
    setDeleteConfirm({ productIds, productNames });
    setConfirmationText('');
    
    // Initialize queue
    setDeleteQueue(productIds.map(id => ({ id, status: 'pending' as const })));
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirm) return;
    
    // Check confirmation text
    if (confirmationText.trim().toLowerCase() !== 'excluir produto') {
      alert('Por favor, digite "excluir produto" para confirmar a exclusão.');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const productsApi = new ProductsApi();
      
      // Process in queue (batch delete)
      const result = await productsApi.deleteBatch(deleteConfirm.productIds);
      
      // Update queue status
      setDeleteQueue(prev => prev.map(item => {
        if (result.success.includes(item.id)) {
          return { ...item, status: 'success' };
        } else {
          const failed = result.failed.find(f => f.id === item.id);
          return { ...item, status: 'failed', error: failed?.error };
        }
      }));
      
      // Wait a bit to show status
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh data
      await fetchData();
      onProductChange();
      
      // Show results
      const successCount = result.success.length;
      const failedCount = result.failed.length;
      
      if (failedCount === 0) {
        alert(`${successCount} produto${successCount !== 1 ? 's' : ''} excluído${successCount !== 1 ? 's' : ''} com sucesso!`);
      } else {
        alert(`${successCount} produto${successCount !== 1 ? 's' : ''} excluído${successCount !== 1 ? 's' : ''}. ${failedCount} falha${failedCount !== 1 ? 's' : ''}.`);
      }
      
      setDeleteConfirm(null);
      setDeleteQueue([]);
      setConfirmationText('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao excluir produtos: ${message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-neutral-100 font-sans text-neutral-900">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-black text-white flex flex-col py-8 z-50 transition-all duration-300">
        <div className="flex flex-col items-center md:items-start md:px-8 space-y-6 flex-shrink-0">
           <div className="text-2xl font-black uppercase tracking-tighter hidden md:block">AURICAPRI<span className="text-neutral-500">.OS</span></div>
           <div className="md:hidden font-black text-xl">OS</div>
           
           <nav className="flex flex-col gap-1 w-full overflow-y-auto flex-1 min-h-0">
              <div className="space-y-1">
                <div className="hidden md:block text-[8px] font-black uppercase tracking-widest text-neutral-500 px-3 mb-2">Principal</div>
                {[
                  { id: 'health', icon: BarChart3, label: 'Health' },
                  { id: 'dream', icon: Lightbulb, label: 'Dream Board' },
                  { id: 'orders', icon: Box, label: 'Pedidos' },
                  { id: 'delivery', icon: Truck, label: 'Delivery' },
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-4 p-2.5 rounded-xl transition-all w-full ${activeTab === item.id ? 'bg-white text-black font-bold' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}
                  >
                     <item.icon className="w-4 h-4 flex-shrink-0" />
                     <span className="hidden md:block text-[10px] uppercase tracking-widest truncate">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1 mt-4">
                <div className="hidden md:block text-[8px] font-black uppercase tracking-widest text-neutral-500 px-3 mb-2">Produtos</div>
                {[
                  { id: 'inventory', icon: Tag, label: 'Catálogo' },
                  { id: 'suppliers', icon: Store, label: 'Fornecedores' },
                  { id: 'taxonomy', icon: Layers, label: 'Taxonomia' },
                  { id: 'guides', icon: Ruler, label: 'Guias' },
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-4 p-2.5 rounded-xl transition-all w-full ${activeTab === item.id ? 'bg-white text-black font-bold' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}
                  >
                     <item.icon className="w-4 h-4 flex-shrink-0" />
                     <span className="hidden md:block text-[10px] uppercase tracking-widest truncate">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1 mt-4">
                <div className="hidden md:block text-[8px] font-black uppercase tracking-widest text-neutral-500 px-3 mb-2">Marketing</div>
                {[
                  { id: 'marketing', icon: ImageIcon, label: 'Marketing' },
                  { id: 'coupons', icon: Ticket, label: 'Cupons' },
                  { id: 'assets', icon: Archive, label: 'Insumos' },
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-4 p-2.5 rounded-xl transition-all w-full ${activeTab === item.id ? 'bg-white text-black font-bold' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}
                  >
                     <item.icon className="w-4 h-4 flex-shrink-0" />
                     <span className="hidden md:block text-[10px] uppercase tracking-widest truncate">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1 mt-4">
                <div className="hidden md:block text-[8px] font-black uppercase tracking-widest text-neutral-500 px-3 mb-2">Sistema</div>
                {[
                  { id: 'about', icon: BookOpen, label: 'Sobre Nós' },
                  { id: 'users', icon: Users, label: 'Usuários' },
                  { id: 'system', icon: Settings, label: 'Sistema' },
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-4 p-2.5 rounded-xl transition-all w-full ${activeTab === item.id ? 'bg-white text-black font-bold' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}
                  >
                     <item.icon className="w-4 h-4 flex-shrink-0" />
                     <span className="hidden md:block text-[10px] uppercase tracking-widest truncate">{item.label}</span>
                  </button>
                ))}
              </div>
           </nav>
        </div>
        
        <div className="px-4 md:px-8 mt-auto flex-shrink-0">
           <button onClick={onLogout} className="flex items-center gap-4 text-red-500 hover:text-red-400 transition-colors p-2.5 w-full">
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:block text-[10px] uppercase tracking-widest font-bold">Sair</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col min-h-0">
         {isLoading ? (
            <div className="flex items-center justify-center h-full">
               <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
            </div>
         ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 md:p-12 min-h-0">
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
                   onEdit={(p) => setEditingItem({ type: 'product', data: p })} 
                   onDelete={(ids) => handleDeleteProduct(ids)} 
                   onAdd={() => setEditingItem({ type: 'product', data: { name: { pt: '' }, variants: [], is_active: true } })} 
                   locale={locale}
                 />
               )}
               {activeTab === 'suppliers' && (
                 <AdminSuppliers
                   suppliers={suppliers}
                   onEdit={(s) => {
                     setEditingSupplier(s);
                     setShowSupplierEditor(true);
                   }}
                   onDelete={async (id) => {
                     try {
                       const suppliersApi = new SuppliersApi();
                       await suppliersApi.delete(id);
                       await fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar';
      alert(message);
    }
                   }}
                   onAdd={() => {
                     setEditingSupplier(null);
                     setShowSupplierEditor(true);
                   }}
                 />
               )}
               {activeTab === 'orders' && (
                 <AdminOrders 
                   orders={orders} 
                   products={products} 
                   assets={assets} 
                   onUpdateStatus={handleUpdateOrderStatus} 
                   locale={locale} 
                 />
               )}
               {activeTab === 'delivery' && (
                 <AdminDelivery 
                   orders={orders}
                   suppliers={suppliers}
                   locale={locale}
                 />
               )}
               {activeTab === 'taxonomy' && (
                  <AdminTaxonomy 
                    categories={categories} 
                    collections={collections}
                    onEditCategory={(c) => setEditingItem({ type: 'category', data: c })}
                    onEditCollection={(c) => setEditingItem({ type: 'collection', data: c })}
                    onAddCategory={() => setEditingItem({ type: 'category', data: { name: { pt: '' }, is_active: true } })}
                    onAddCollection={() => setEditingItem({ type: 'collection', data: { name: { pt: '' }, is_active: true } })}
                    locale={locale}
                  />
               )}
               {activeTab === 'guides' && (
                  <AdminGuides
                    guides={sizeGuides}
                    onAdd={(g) => { setSizeGuides(prev => [...prev, g]); }}
                    onUpdate={(g) => { setSizeGuides(prev => prev.map(item => item.id === g.id ? g : item)); }}
                    onDelete={(id) => { setSizeGuides(prev => prev.filter(item => item.id !== id)); }}
                  />
               )}
               {activeTab === 'marketing' && (
                  <AdminMarketing 
                    banners={banners} 
                    onEdit={(b) => setEditingItem({ type: 'banner', data: b })} 
                    onRefresh={fetchData}
                    locale={locale}
                  />
               )}
               {activeTab === 'coupons' && (
                  <AdminCoupons 
                    coupons={coupons} 
                    onAdd={() => setEditingCoupon({ code: '', discount_type: 'percentage', discount_value: 0, is_active: true } as Coupon)}
                    onEdit={setEditingCoupon}
                  />
               )}
               {activeTab === 'assets' && (
                  <AdminAssets 
                    assets={assets} 
                    onAdd={async (a) => { 
                      const assetsApi = new AssetsApi();
                      await assetsApi.create(a);
                      fetchData();
                    }} 
                    onUpdate={async (a) => { 
                      const assetsApi = new AssetsApi();
                      await assetsApi.update(a.id, a);
                      fetchData();
                    }} 
                    onDelete={async (id) => { 
                      const assetsApi = new AssetsApi();
                      await assetsApi.delete(id);
                      fetchData();
                    }} 
                    locale={locale}
                  />
               )}
               {activeTab === 'about' && (
                  <AdminAboutUs
                    config={config}
                    onChange={setConfig}
                    onSave={handleSystemSave}
                    locale={editLocale}
                    onLocaleChange={setEditLocale}
                  />
               )}
               {activeTab === 'users' && <AdminUsers users={users} />}
               {activeTab === 'system' && (
                  <AdminSystem 
                    config={config} 
                    onChange={setConfig} 
                    onSave={handleSystemSave} 
                    isLoading={false} 
                    editLocale={editLocale} 
                    onLocaleChange={setEditLocale} 
                  />
               )}
            </div>
         )}
      </main>

      {/* Modals */}
      {editingItem && (
         <AdminEditorModal 
           item={{ ...editingItem, editLocale: editLocale }} 
           categories={categories} 
           collections={collections} 
           products={products} 
           assets={assets} 
           sizeGuides={sizeGuides}
           suppliers={suppliers}
           globalConfig={config.financial_settings}
           onClose={() => setEditingItem(null)} 
           onSave={handleSaveItem} 
           onUpdateData={(newData) => setEditingItem({ ...editingItem, data: newData })}
           onLocaleChange={setEditLocale} 
           onCloneLocale={() => {}}
           t={t}
           locale={locale}
         />
      )}
      
      {editingCoupon && (
         <AdminCouponEditor 
           coupon={editingCoupon} 
           products={products} 
           financials={config.financial_settings || {} as GlobalFinancialSettings}
           onClose={() => setEditingCoupon(null)} 
           onSave={handleSaveCoupon} 
           locale={locale} 
         />
      )}

      {showSupplierEditor && (
         <AdminSupplierEditor
           supplier={editingSupplier}
           onClose={() => {
             setShowSupplierEditor(false);
             setEditingSupplier(null);
           }}
           onSave={async (supplierData) => {
             try {
               const suppliersApi = new SuppliersApi();
               if (editingSupplier?.id) {
                 await suppliersApi.update(editingSupplier.id, supplierData);
               } else {
                 await suppliersApi.create(supplierData);
               }
               await fetchData();
               setShowSupplierEditor(false);
               setEditingSupplier(null);
             } catch (error: unknown) {
               console.error('[AdminDashboard] Error saving supplier:', error);
               throw error;
             }
           }}
         />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden my-8">
            <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">Confirmar Exclusão em Lote</h3>
                <p className="text-sm text-red-700">
                  {deleteConfirm.productIds.length} produto{deleteConfirm.productIds.length !== 1 ? 's' : ''} selecionado{deleteConfirm.productIds.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
              <div className="mb-4">
                <p className="text-sm text-neutral-600 mb-3 font-medium">
                  Você está prestes a excluir permanentemente {deleteConfirm.productIds.length} produto{deleteConfirm.productIds.length !== 1 ? 's' : ''}:
                </p>
                <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4 max-h-48 overflow-y-auto">
                  <ul className="space-y-2">
                    {deleteConfirm.productNames.map((name, idx) => (
                      <li key={idx} className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Atenção: Esta ação não pode ser desfeita!
                </p>
                <ul className="text-xs text-red-800 space-y-1 ml-6">
                  <li>• Os produtos serão removidos permanentemente do catálogo</li>
                  <li>• Todas as variações serão excluídas</li>
                  <li>• Os produtos serão desvinculados de coleções, cupons e wishlists</li>
                  <li>• Esta ação não pode ser recuperada</li>
                </ul>
              </div>

              {/* Confirmation Text Input */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-neutral-700 mb-2">
                  Para confirmar, digite: <span className="text-red-600 font-mono">excluir produto</span>
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="excluir produto"
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                  disabled={isDeleting}
                  autoFocus
                />
                {confirmationText.trim().toLowerCase() !== 'excluir produto' && confirmationText.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">O texto deve ser exatamente "excluir produto"</p>
                )}
              </div>

              {/* Queue Status */}
              {deleteQueue.length > 0 && (
                <div className="mb-6 bg-neutral-50 rounded-lg border border-neutral-200 p-4">
                  <p className="text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">
                    Status da Fila de Exclusão
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {deleteQueue.map((item, idx) => {
                      const productName = deleteConfirm.productNames[idx] || 'Produto';
                      return (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <span className="truncate flex-1">{productName}</span>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            item.status === 'success' ? 'bg-green-100 text-green-700' :
                            item.status === 'failed' ? 'bg-red-100 text-red-700' :
                            item.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            'bg-neutral-100 text-neutral-600'
                          }`}>
                            {item.status === 'success' ? '✓ Excluído' :
                             item.status === 'failed' ? '✗ Erro' :
                             item.status === 'processing' ? '⏳ Processando' :
                             '⏸ Aguardando'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteConfirm(null);
                    setDeleteQueue([]);
                    setConfirmationText('');
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  disabled={isDeleting || confirmationText.trim().toLowerCase() !== 'excluir produto'}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Excluir {deleteConfirm.productIds.length} Produto{deleteConfirm.productIds.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
