
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Users, Settings, LogOut,
  BarChart3, Tag, Layers, Image as ImageIcon, Ticket, Archive, BookOpen, Ruler, Lightbulb,
  AlertTriangle, X, Loader2, Store, Truck, ShoppingBag, ChevronDown, DollarSign
} from 'lucide-react';
// Supabase is only used for auth.signOut() which is safe
import {
  productsApi,
  ordersApi,
  usersApi,
  storeApi,
  couponsApi,
  collectionsApi,
  assetsApi,
  guidesApi,
  bannersApi,
  suppliersApi,
  marketingApi,
} from '../../api/instances';
import { logger } from '../../utils/logger';
import { Locale } from '../../i18n';
import {
  Product, Category, Collection, Banner, Coupon, Asset,
  StoreConfig, UserProfile, Order, GlobalFinancialSettings, SizeGuide, Supplier
} from '../../types';
import { OrderStatus } from '../../constants/enums';

// Lazy load admin tabs para melhor performance
const AdminHealth = React.lazy(() => import('./AdminHealth'));
const AdminInventory = React.lazy(() => import('./AdminInventory'));
const AdminOrders = React.lazy(() => import('./AdminOrders'));
const AdminTaxonomy = React.lazy(() => import('./AdminTaxonomy'));
const AdminMarketing = React.lazy(() => import('./AdminMarketing'));
const AdminAssets = React.lazy(() => import('./AdminAssets'));
const AdminCoupons = React.lazy(() => import('./AdminCoupons'));
const AdminUsers = React.lazy(() => import('./AdminUsers'));
const AdminSystem = React.lazy(() => import('./AdminSystem'));
const AdminAboutUs = React.lazy(() => import('./AdminAboutUs'));
const AdminGuides = React.lazy(() => import('./AdminGuides'));
const AdminDreamBoard = React.lazy(() => import('./AdminDreamBoard'));
const AdminSuppliers = React.lazy(() => import('./AdminSuppliers'));
const AdminDelivery = React.lazy(() => import('./AdminDelivery'));
const AdminMarketplaces = React.lazy(() => import('./AdminMarketplaces'));
const FinancialDashboard = React.lazy(() => import('./FinancialDashboard'));

// Modals/Editors podem ser lazy loaded também
const AdminEditorModal = React.lazy(() => import('./AdminEditorModal'));
const AdminCouponEditor = React.lazy(() => import('./AdminCouponEditor'));
const AdminSupplierEditor = React.lazy(() => import('./AdminSupplierEditor'));
const AdminCampaignEditor = React.lazy(() => import('./AdminCampaignEditor'));

import { Campaign } from '../../api/marketing.api';

interface AdminDashboardProps {
  onLogout: () => void;
  t: (key: string) => string;
  locale: Locale;
  onProductChange: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, t, locale, onProductChange }) => {
  const [activeTab, setActiveTab] = useState('health');
  const [marketingSubTab, setMarketingSubTab] = useState<'banners' | 'campaigns' | 'users' | 'analytics'>('banners');
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsRefreshing] = useState(false);
  const [editLocale, setEditLocale] = useState<Locale>(locale);

  // Sidebar categories collapse state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['principal', 'produtos', 'vendas', 'sistema'])
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showCampaignEditor, setShowCampaignEditor] = useState(false);
  const [isDeletingTaxonomy, setIsDeletingTaxonomy] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ productIds: string[]; productNames: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteQueue, setDeleteQueue] = useState<Array<{ id: string; status: 'pending' | 'processing' | 'success' | 'failed'; error?: string }>>([]);
  const [confirmationText, setConfirmationText] = useState('');

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // Usa singletons de API em vez de criar novas instâncias
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
        suppliersData,
        campaignsData
      ] = await Promise.all([
        productsApi.getAll(),
        storeApi.getAllCategoriesAdmin(),
        collectionsApi.getAll(),
        bannersApi.getAll(),
        couponsApi.getAll(),
        assetsApi.getAll(),
        ordersApi.getAllAdmin(),
        usersApi.getAll(),
        storeApi.getConfig(),
        guidesApi.getAll(),
        suppliersApi.getAll(),
        marketingApi.getCampaigns()
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
      setCampaigns(campaignsData);

    } catch (e) {
      logger.error("Admin Fetch Error", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, trackingCode?: string) => {
    try {
      const updatedOrder = await ordersApi.updateStatus(orderId, status as OrderStatus, trackingCode);
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar pedido';
      alert(message);
    }
  };

  // Função para gerar slug a partir do nome
  const generateSlug = (name: string | { pt?: string; en?: string } | undefined): string => {
    const text = typeof name === 'string'
      ? name
      : (name?.pt || name?.en || '');

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
      .replace(/^-+|-+$/g, '') // Remove hífens do início e fim
      .substring(0, 100) // Limita tamanho
      || `produto-${Date.now()}`; // Fallback se vazio
  };

  // Função utilitária para preparar payload com slug e description padrão
  const preparePayloadWithSlugAndDescription = (payload: Record<string, unknown>): void => {
    // Gerar slug automaticamente se não existir
    if (!payload.slug || (typeof payload.slug === 'string' && payload.slug.trim() === '')) {
      payload.slug = generateSlug(payload.name as string | { pt?: string; en?: string });
    }

    // Garantir que description tenha valor padrão
    if (!payload.description) {
      payload.description = typeof payload.name === 'object'
        ? { pt: '', en: '' }
        : '';
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
      delete payload._associatedProductIds; // Virtual field - computed client-side only

      if (type === 'product') {
        preparePayloadWithSlugAndDescription(payload);
        if (data.id) {
          await productsApi.update(data.id, { ...payload, variants });
        } else {
          await productsApi.create({ ...payload, variants });
        }
      } else if (type === 'collection') {
        preparePayloadWithSlugAndDescription(payload);
        if (data.id) {
          await collectionsApi.update(data.id, payload);
        } else {
          await collectionsApi.create(payload);
        }
      } else if (type === 'category') {
        preparePayloadWithSlugAndDescription(payload);
        if (data.id) {
          await storeApi.updateCategory(data.id, payload);
        } else {
          await storeApi.createCategory(payload);
        }
      } else if (type === 'banner') {
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

  const requestDeleteTaxonomy = useCallback(async () => {
    if (!editingItem) return;
    if (editingItem.type !== 'category' && editingItem.type !== 'collection') return;
    const data = editingItem.data as any;
    if (!data?.id) return;

    const rawName = data.name;
    const name =
      (typeof rawName === 'string'
        ? rawName
        : (rawName && typeof rawName === 'object'
            ? (rawName[locale] || rawName.pt || rawName.en || '')
            : '')) || (editingItem.type === 'category' ? 'Categoria' : 'Coleção');
    const associatedCount = Array.isArray(data._associatedProductIds) ? data._associatedProductIds.length : 0;

    if (associatedCount > 0) {
      alert('Esta taxonomia está vinculada a produtos. Remova os vínculos antes de excluir.');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
    if (isDeletingTaxonomy) return;

    setIsDeletingTaxonomy(true);
    try {
      if (editingItem.type === 'category') {
        await storeApi.deleteCategory(String(data.id));
      } else {
        await collectionsApi.delete(String(data.id));
      }

      await fetchData();
      onProductChange();
      setEditingItem(null);
      alert(`${editingItem.type === 'category' ? 'Categoria' : 'Coleção'} excluída com sucesso.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(message);
    } finally {
      setIsDeletingTaxonomy(false);
    }
  }, [editingItem, fetchData, isDeletingTaxonomy, locale, onProductChange]);

  const handleSaveCoupon = async (coupon: Coupon) => {
    try {
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

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await couponsApi.delete(couponId);
      await fetchData();
      setEditingCoupon(null);
      alert('Cupom excluído com sucesso.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir cupom';
      alert(message);
      throw error;
    }
  };

  const handleSaveCampaign = async (campaign: Partial<Campaign>) => {
    try {
      if (campaign.id) {
        await marketingApi.updateCampaign(campaign.id, campaign);
      } else {
        await marketingApi.createCampaign(campaign);
      }
      // Since AdminMarketing handles its own state for campaigns, 
      // we might need a way to tell it to refresh, or just rely on its tab switch effect.
      // But for better UX, we'll trigger a refresh if we can.
      fetchData(); // This refreshes banners and other things, but not campaigns directly in AdminMarketing
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar campanha';
      alert(message);
      throw error;
    }
  };

  const handleSystemSave = async () => {
    try {
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
           
           <nav className="flex flex-col gap-1 w-full overflow-y-auto flex-1 min-h-0 pr-1">
              {/* Principal Category */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleCategory('principal')}
                  className="hidden md:flex items-center justify-between w-full text-[8px] font-black uppercase tracking-widest text-neutral-500 px-3 py-1.5 hover:text-neutral-300 transition-colors"
                >
                  <span>Principal</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${!expandedCategories.has('principal') ? '-rotate-90' : ''}`} />
                </button>
                {expandedCategories.has('principal') && (
                  <div className="space-y-1">
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
                )}
              </div>

              {/* Produtos Category */}
              <div className="space-y-1 mt-2">
                <button
                  onClick={() => toggleCategory('produtos')}
                  className="hidden md:flex items-center justify-between w-full text-[8px] font-black uppercase tracking-widest text-neutral-500 px-3 py-1.5 hover:text-neutral-300 transition-colors"
                >
                  <span>Produtos</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${!expandedCategories.has('produtos') ? '-rotate-90' : ''}`} />
                </button>
                {expandedCategories.has('produtos') && (
                  <div className="space-y-1">
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
                )}
              </div>

              {/* Vendas Category */}
              <div className="space-y-1 mt-2">
                <button
                  onClick={() => toggleCategory('vendas')}
                  className="hidden md:flex items-center justify-between w-full text-[8px] font-black uppercase tracking-widest text-neutral-500 px-3 py-1.5 hover:text-neutral-300 transition-colors"
                >
                  <span>Vendas</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${!expandedCategories.has('vendas') ? '-rotate-90' : ''}`} />
                </button>
                {expandedCategories.has('vendas') && (
                  <div className="space-y-1">
                    {[
                      { id: 'financial', icon: DollarSign, label: 'Financeiro' },
                      { id: 'marketplaces', icon: ShoppingBag, label: 'Marketplaces' },
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
                )}
              </div>

              {/* Sistema Category */}
              <div className="space-y-1 mt-2">
                <button
                  onClick={() => toggleCategory('sistema')}
                  className="hidden md:flex items-center justify-between w-full text-[8px] font-black uppercase tracking-widest text-neutral-500 px-3 py-1.5 hover:text-neutral-300 transition-colors"
                >
                  <span>Sistema</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${!expandedCategories.has('sistema') ? '-rotate-90' : ''}`} />
                </button>
                {expandedCategories.has('sistema') && (
                  <div className="space-y-1">
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
                )}
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
               <React.Suspense fallback={
                  <div className="flex items-center justify-center min-h-[400px]">
                     <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                  </div>
               }>
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
               {activeTab === 'marketplaces' && (
                 <AdminMarketplaces locale={locale} />
               )}
               {activeTab === 'financial' && (
                 <FinancialDashboard />
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
                    campaigns={campaigns}
                    onEdit={(b) => setEditingItem({ type: 'banner', data: b })} 
                    onRefresh={() => fetchData(true)}
                    locale={locale}
                    activeTab={marketingSubTab}
                    onTabChange={setMarketingSubTab}
                    onAddCampaign={() => {
                      setEditingCampaign(null);
                      setShowCampaignEditor(true);
                    }}
                    onEditCampaign={(c) => {
                      setEditingCampaign(c);
                      setShowCampaignEditor(true);
                    }}
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
                      await assetsApi.create(a);
                      fetchData();
                    }}
                    onUpdate={async (a) => {
                      await assetsApi.update(a.id, a);
                      fetchData();
                    }}
                    onDelete={async (id) => {
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
               </React.Suspense>
            </div>
         )}
      </main>

      {/* Modals */}
      {editingItem && (
         <React.Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
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
              onDelete={(_id) => requestDeleteTaxonomy()}
              t={t}
              locale={locale}
            />
         </React.Suspense>
      )}
      
      {editingCoupon && (
         <React.Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
            <AdminCouponEditor
              coupon={editingCoupon}
              products={products}
              financials={config.financial_settings || {} as GlobalFinancialSettings}
              onClose={() => setEditingCoupon(null)}
              onSave={handleSaveCoupon}
              onDelete={handleDeleteCoupon}
              locale={locale}
            />
         </React.Suspense>
      )}

      {showSupplierEditor && (
         <React.Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
            <AdminSupplierEditor
              supplier={editingSupplier}
              onClose={() => {
                setShowSupplierEditor(false);
                setEditingSupplier(null);
              }}
              onSave={async (supplierData) => {
                try {
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
         </React.Suspense>
      )}

      {showCampaignEditor && (
         <React.Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
            <AdminCampaignEditor
              campaign={editingCampaign}
              onClose={() => {
                setShowCampaignEditor(false);
                setEditingCampaign(null);
              }}
              onSave={async (campaignData) => {
                await handleSaveCampaign(campaignData);
                // After saving, we need to refresh the campaigns in AdminMarketing.
                // Since AdminMarketing is a child and has its own state,
                // the easiest way is to let the user see the update after save.
                // If AdminMarketing was using props for campaigns, fetchData would work.
                // But since it fetches on tab switch, we might need a refresh prop.
              }}
              onDelete={async (id) => {
                try {
                  await marketingApi.deleteCampaign(id);
                  fetchData();
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : 'Erro ao excluir campanha';
                  alert(message);
                  throw error;
                }
              }}
            />
         </React.Suspense>
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
