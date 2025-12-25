
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Box, Users, Settings, LogOut, 
  BarChart3, Tag, Layers, Image as ImageIcon, Ticket, Archive, BookOpen, Ruler 
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { Locale } from '../i18n';
import { 
  Product, Category, Collection, Banner, Coupon, Asset, 
  StoreConfig, UserProfile, Order, GlobalFinancialSettings, SizeGuide 
} from '../types';

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
      const [
        prodRes, catRes, collRes, banRes, coupRes, assRes, ordRes, userRes, confRes, guideRes
      ] = await Promise.all([
        supabase.from('products').select('*, variants:product_variants(*)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('collections').select('*').order('name'),
        supabase.from('banners').select('*').order('sort_order'),
        supabase.from('coupons').select('*').order('code'),
        supabase.from('assets').select('*').order('name'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('store_config').select('*').limit(1).maybeSingle(),
        supabase.from('size_guides').select('*').order('name')
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (collRes.data) setCollections(collRes.data);
      if (banRes.data) setBanners(banRes.data);
      if (coupRes.data) setCoupons(coupRes.data);
      if (assRes.data) setAssets(assRes.data);
      if (guideRes.data) setSizeGuides(guideRes.data);
      if (ordRes.data) {
        // Correctly map database 'total_amount' to app 'total' property
        const mappedOrders = ordRes.data.map((o: any) => ({
            ...o,
            total: o.total_amount || o.total || 0, // Fallback to ensure value
            items: o.items || []
        }));
        setOrders(mappedOrders);
      }
      if (userRes.data) setUsers(userRes.data as UserProfile[]);
      if (confRes.data) setConfig(confRes.data);

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
      const updateData: any = { status };
      if (trackingCode) updateData.tracking_code = trackingCode;
      
      const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateData } : o));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { type, data } = editingItem;
      let table = '';
      if (type === 'product') table = 'products';
      else if (type === 'category') table = 'categories';
      else if (type === 'collection') table = 'collections';
      else if (type === 'banner') table = 'banners';

      if (!table) return;

      // Clean up data for save (remove UI specific helpers if any)
      const payload = { ...data };
      delete payload.variants; // Handled separately usually, or via upsert if DB allows.
      // Supabase simplistic approach: update parent, then variants.
      // For this demo, let's assume simple upsert for main entity.
      
      const { data: savedData, error } = await supabase.from(table).upsert(payload).select().single();
      if (error) throw error;

      // Handle Variants if product
      if (type === 'product' && data.variants) {
         // Upsert all current.
         const { error: vError } = await supabase.from('product_variants').upsert(
            data.variants.map((v: any) => ({ ...v, product_id: savedData.id }))
         );
         if (vError) throw vError;
      }

      await fetchData(); // Refresh all
      onProductChange(); // Notify parent
      setEditingItem(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveCoupon = async (coupon: Coupon) => {
    try {
      const { error } = await supabase.from('coupons').upsert(coupon);
      if (error) throw error;
      fetchData();
      setEditingCoupon(null);
    } catch(e: any) {
      alert(e.message);
    }
  };

  const handleSystemSave = async () => {
     try {
       const { error } = await supabase.from('store_config').upsert(config);
       if (error) throw error;
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
                    onAdd={async (a) => { await supabase.from('assets').insert(a); fetchData(); }} 
                    onUpdate={async (a) => { await supabase.from('assets').update(a).eq('id', a.id); fetchData(); }} 
                    onDelete={async (id) => { await supabase.from('assets').delete().eq('id', id); fetchData(); }} 
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
