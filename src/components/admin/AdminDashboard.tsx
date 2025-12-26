
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Box, Users, Settings, LogOut, 
  BarChart3, Tag, Layers, Image as ImageIcon, Ticket, Archive, BookOpen, Ruler 
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
import { Locale } from '../../i18n';
import { 
  Product, Category, Collection, Banner, Coupon, Asset, 
  StoreConfig, UserProfile, Order, GlobalFinancialSettings, SizeGuide 
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

interface AdminDashboardProps {
  onLogout: () => void;
  t: (key: string) => any;
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
  const [editingItem, setEditingItem] = useState<{ type: string; data: any } | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

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
        guidesData
      ] = await Promise.all([
        productsApi.getAll().then(products => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af849f59-06a9-4c87-a481-c8690fe2a6dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:106',message:'fetchData - products loaded',data:{productsCount:products.length,productsWithVariants:products.filter(p=>p.variants&&p.variants.length>0).length,allVariantsCount:products.reduce((sum,p)=>(sum+(p.variants?.length||0)),0),sampleProductVariants:products.slice(0,3).map(p=>({id:p.id,variantsCount:p.variants?.length||0,variantIds:p.variants?.map(v=>v.id)||[]}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          return products;
        }),
        storeApi.getAllCategories(),
        collectionsApi.getAll(),
        bannersApi.getAll(),
        couponsApi.getAll(),
        assetsApi.getAll(),
        ordersApi.getAll(), // This will need to be changed to get all orders for admin
        usersApi.getAll(),
        storeApi.getConfig(),
        guidesApi.getAll()
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
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { type, data } = editingItem;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af849f59-06a9-4c87-a481-c8690fe2a6dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:151',message:'handleSaveItem - entry',data:{type,hasData:!!data,dataId:data?.id,hasVariants:!!data?.variants,variantsCount:data?.variants?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      const payload = { ...data };
      const variants = payload.variants;
      delete payload.variants; // Variants handled separately

      if (type === 'product') {
        const productsApi = new ProductsApi();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/af849f59-06a9-4c87-a481-c8690fe2a6dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:161',message:'handleSaveItem - before product save',data:{productId:data.id,hasVariants:!!variants,variantsCount:variants?.length||0,variantIds:variants?.map(v=>({id:v.id,sku:v.sku,product_id:v.product_id}))||[],payloadKeys:Object.keys(payload)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        if (data.id) {
          // Include variants in update payload
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af849f59-06a9-4c87-a481-c8690fe2a6dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:172',message:'handleSaveItem - calling productsApi.update',data:{productId:data.id,variantsPayload:variants?.map(v=>({id:v.id,sku:v.sku,product_id:v.product_id,hasAllRequiredFields:!!(v.id&&v.sku&&v.product_id)}))||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          let updateResult;
          try {
            updateResult = await productsApi.update(data.id, { ...payload, variants });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/af849f59-06a9-4c87-a481-c8690fe2a6dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:177',message:'handleSaveItem - product update success',data:{productId:data.id,returnedVariantsCount:updateResult?.variants?.length||0,returnedVariantIds:updateResult?.variants?.map(v=>v.id)||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
          } catch (updateError: any) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/af849f59-06a9-4c87-a481-c8690fe2a6dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:180',message:'handleSaveItem - product update error',data:{productId:data.id,errorMessage:updateError?.message,errorStack:updateError?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            throw updateError;
          }
        } else {
          // Include variants in create payload
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af849f59-06a9-4c87-a481-c8690fe2a6dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:186',message:'handleSaveItem - calling productsApi.create',data:{variantsPayload:variants?.map(v=>({id:v.id,sku:v.sku,product_id:v.product_id}))||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          await productsApi.create({ ...payload, variants });
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/af849f59-06a9-4c87-a481-c8690fe2a6dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:189',message:'handleSaveItem - product create success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
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

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af849f59-06a9-4c87-a481-c8690fe2a6dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:200',message:'handleSaveItem - before fetchData',data:{productId:type==='product'?data.id:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      await fetchData();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/af849f59-06a9-4c87-a481-c8690fe2a6dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:203',message:'handleSaveItem - after fetchData',data:{productId:type==='product'?data.id:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      onProductChange();
      setEditingItem(null);
    } catch (e: any) {
      alert(e.message);
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
    } catch(e: any) {
      alert(e.message);
    }
  };

  const handleSystemSave = async () => {
     try {
       const storeApi = new StoreApi();
       await storeApi.updateConfig(config);
       alert("Configurações salvas!");
     } catch (e: any) {
       alert(e.message);
     }
  };

  return (
    <div className="flex h-screen w-full bg-neutral-100 font-sans text-neutral-900">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-black text-white flex flex-col justify-between py-8 z-50 transition-all duration-300">
        <div className="flex flex-col items-center md:items-start md:px-8 space-y-12">
           <div className="text-2xl font-black uppercase tracking-tighter hidden md:block">AURICAPRI<span className="text-neutral-500">.OS</span></div>
           <div className="md:hidden font-black text-xl">OS</div>
           
           <nav className="flex flex-col gap-2 w-full">
              {[
                { id: 'health', icon: BarChart3, label: 'Health' },
                { id: 'orders', icon: Box, label: 'Pedidos' },
                { id: 'inventory', icon: Tag, label: 'Catálogo' },
                { id: 'taxonomy', icon: Layers, label: 'Taxonomia' },
                { id: 'guides', icon: Ruler, label: 'Guias' }, // New Tab
                { id: 'marketing', icon: ImageIcon, label: 'Marketing' },
                { id: 'coupons', icon: Ticket, label: 'Cupons' },
                { id: 'assets', icon: Archive, label: 'Insumos' },
                { id: 'about', icon: BookOpen, label: 'Sobre Nós' },
                { id: 'users', icon: Users, label: 'Usuários' },
                { id: 'system', icon: Settings, label: 'Sistema' },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-white text-black font-bold' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}
                >
                   <item.icon className="w-5 h-5" />
                   <span className="hidden md:block text-[10px] uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
           </nav>
        </div>
        
        <div className="px-4 md:px-8">
           <button onClick={onLogout} className="flex items-center gap-4 text-red-500 hover:text-red-400 transition-colors p-3">
              <LogOut className="w-5 h-5" />
              <span className="hidden md:block text-[10px] uppercase tracking-widest font-bold">Sair</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
         {isLoading ? (
            <div className="flex items-center justify-center h-full">
               <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
            </div>
         ) : (
            <div className="flex-1 overflow-y-auto p-8 md:p-12">
               {activeTab === 'health' && (
                 <AdminHealth 
                   products={products} 
                   assets={assets} 
                   orders={orders} 
                   financials={config.financial_settings || {} as GlobalFinancialSettings} 
                   locale={locale} 
                 />
               )}
               {activeTab === 'inventory' && (
                 <AdminInventory 
                   products={products} 
                   onEdit={(p) => setEditingItem({ type: 'product', data: p })} 
                   onDelete={() => {}} 
                   onAdd={() => setEditingItem({ type: 'product', data: { name: { pt: '' }, variants: [], is_active: true } })} 
                   locale={locale}
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
           sizeGuides={sizeGuides} // Pass Size Guides to Editor
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
    </div>
  );
};

export default AdminDashboard;
