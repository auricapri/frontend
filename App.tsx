
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import ProductDetail from './components/ProductDetail';
import CollectionDetail from './components/CollectionDetail';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import CouponsDrawer from './components/CouponsDrawer';
import AuthDrawer from './components/AuthDrawer';
import CheckoutView, { AddressData } from './components/CheckoutView';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import OrderResultOverlay from './components/OrderResultOverlay';
import OrderReceipt from './components/OrderReceipt';
import Toast from './components/Toast';
import { Product, CartItem, UserMode, UserProfile, Category, Collection, Banner, StoreConfig, Coupon, Asset, InternalLogisticsInfo, Order, SavedAddress, SavedCard } from './types';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { Locale, translations } from './i18n';
import { supabase } from '../utils/supabase';

export const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>('en');
  const [userMode, setUserMode] = useState<UserMode>(UserMode.RETAIL);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]); 
  const [assets, setAssets] = useState<Asset[]>([]); 
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    id: 'main',
    brand_name: 'Auricapri',
    terms_of_service: { en: 'Loading...', pt: 'Carregando...' },
    privacy_policy: { en: 'Loading...', pt: 'Carregando...' }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; visible: boolean; type?: 'info' | 'error' }>({ message: '', visible: false });

  const showToast = (message: string, type: 'info' | 'error' = 'info') => {
      setToast({ message, visible: true, type });
  };

  const closeToast = () => setToast(prev => ({ ...prev, visible: false }));

  // Order Result State for Animation
  const [orderResult, setOrderResult] = useState<{ status: 'success' | 'error', orderId?: string, message?: string, fullOrder?: Order } | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [legalView, setLegalView] = useState<'terms' | 'privacy' | null>(null);
  
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  const [currentView, setCurrentView] = useState<'home' | 'product' | 'collection' | 'admin' | 'checkout' | 'receipt'>('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  // Store the last successful order for the Receipt view
  const [lastSuccessOrder, setLastSuccessOrder] = useState<Order | null>(null);

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setWishlistIds([]); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && pendingCheckout) {
      setPendingCheckout(false);
      handleNavigate('checkout');
    }
  }, [currentUser, pendingCheckout]);

  const fetchProfile = async (userId: string) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profile) {
        let user: UserProfile = profile as UserProfile;
        
        // 1. Get Address
        if ((profile as any).default_address_id) {
            const { data: addr } = await supabase.from('addresses').select('*').eq('id', (profile as any).default_address_id).single();
            if (addr) user.default_address = addr as SavedAddress;
        }

        // 2. Get Cards
        const { data: cards } = await supabase.from('user_payment_methods').select('*').eq('user_id', userId);
        if (cards) user.saved_cards = cards as SavedCard[];

        setCurrentUser(user);
    }
  };

  const fetchStoreData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, collRes, banRes, setRes, relRes, coupRes, assRes] = await Promise.all([
        supabase.from('products').select('*, variants:product_variants(*)').eq('is_active', true),
        supabase.from('categories').select('*').eq('is_active', true),
        supabase.from('collections').select('*').eq('is_active', true),
        supabase.from('banners').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('store_config').select('*').limit(1).maybeSingle(),
        supabase.from('collection_products').select('*'),
        supabase.from('coupons').select('*').eq('is_active', true),
        supabase.from('assets').select('*') // Fetch Assets for Validation
      ]);

      const rawProducts = (prodRes.data || []) as Product[];
      const relations = relRes.data || [];

      const processedProducts = rawProducts.map(p => {
        const linkedCollectionIds = relations
          .filter((r: any) => r.product_id === p.id)
          .map((r: any) => r.collection_id);
        
        return {
          ...p,
          collection_ids: linkedCollectionIds
        };
      });

      setProducts(processedProducts);
      if (catRes.data) setCategories(catRes.data as Category[]);
      if (collRes.data) setCollections(collRes.data as Collection[]);
      if (banRes.data) setBanners(banRes.data as Banner[]);
      if (coupRes.data) setCoupons(coupRes.data as Coupon[]);
      if (assRes.data) setAssets(assRes.data as Asset[]);
      if (setRes.data) {
        setStoreConfig(setRes.data as StoreConfig);
        document.title = setRes.data.brand_name;
      }

      setTimeout(() => {
        document.body.classList.add('loaded');
        setIsLoading(false);
      }, 1000);

    } catch (err) {
      console.error('Error fetching store data:', err);
      document.body.classList.add('loaded');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  const t = (key: string) => {
    const keys = key.split('.');
    let result: any = translations[locale];
    for (const k of keys) {
      if (!result || result[k] === undefined) return key;
      result = result[k];
    }
    return result;
  };

  const enterAdmin = () => {
    setCurrentView('admin');
    setIsAuthOpen(false);
  };

  const exitAdmin = () => {
    setCurrentView('home');
    fetchStoreData();
  };

  const handleNavigate = useCallback((view: 'home' | 'product' | 'collection' | 'admin' | 'checkout' | 'receipt', targetSection?: string) => {
    setCurrentView(view);
    
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }

    if (view === 'home') {
      setIsScrolled(false);
      if (!targetSection) {
        setActiveProduct(null);
        setActiveCollection(null);
      }
    }
    
    setTimeout(() => {
      if (view === 'home' && targetSection) {
        const el = document.getElementById(targetSection);
        if (el && mainRef.current) {
          mainRef.current.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
        }
      }
    }, 100);
  }, []);

  const validateCartStock = (): { valid: boolean; error?: string } => {
      const requiredAssets: Record<string, number> = {};

      for (const item of cartItems) {
          const product = products.find(p => p.id === item.product_id);
          const variant = product?.variants?.find(v => v.id === item.variant_id);
          
          if (!variant) continue;

          if (item.quantity > variant.stock_quantity) {
              return { valid: false, error: `Estoque insuficiente para o produto: ${typeof item.name === 'string' ? item.name : (item.name as any).pt}` };
          }

          if (variant.correlated_assets) {
              variant.correlated_assets.forEach(link => {
                  const totalNeeded = link.quantity_required * item.quantity;
                  requiredAssets[link.asset_id] = (requiredAssets[link.asset_id] || 0) + totalNeeded;
              });
          }
      }

      for (const [assetId, qty] of Object.entries(requiredAssets)) {
          const asset = assets.find(a => a.id === assetId);
          if (!asset) {
              return { valid: false, error: `Erro interno: Insumo necessário não encontrado.` };
          }
          if (qty > asset.stock_quantity) {
              return { valid: false, error: `Não há estoque suficiente do insumo: ${asset.name}. Necessário: ${qty}, Disponível: ${asset.stock_quantity}.` };
          }
      }

      return { valid: true };
  };

  const handleCheckoutIntent = () => {
    const stockCheck = validateCartStock();
    if (!stockCheck.valid) {
        showToast(stockCheck.error || "Erro de validação de estoque.", "error");
        return;
    }

    setIsCartOpen(false);
    if (!currentUser) {
      setPendingCheckout(true);
      setIsAuthOpen(true);
    } else {
      handleNavigate('checkout');
    }
  };

  // --- HANDLE PLACE ORDER (SUPABASE INSERT) ---
  const handlePlaceOrder = async (
      addressData: AddressData, 
      logisticsInfo: InternalLogisticsInfo, 
      paymentMethod: 'credit_card' | 'pix', 
      finalAmount: number,
      saveCard: boolean,
      cardToken?: string
  ) => {
    if (cartItems.length === 0) return;
    setIsProcessingOrder(true);

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discountAmount = subtotal - finalAmount;

    try {
      // 1. SAVE/UPDATE ADDRESS & DEFAULT 
      // Rule: If user has no default address, this one becomes default (First Purchase Logic).
      if (currentUser) {
          const isFirstAddress = !currentUser.default_address;
          
          const newAddrPayload = {
              user_id: currentUser.id,
              line1: addressData.logradouro + (addressData.numero ? `, ${addressData.numero}` : ''),
              line2: addressData.bairro + (addressData.complemento ? ` - ${addressData.complemento}` : ''),
              city: addressData.localidade,
              state: addressData.uf,
              postal_code: addressData.cep || '',
              country: 'BR',
              is_default: isFirstAddress 
          };

          const { data: addrData } = await supabase.from('addresses').insert(newAddrPayload).select().single();
          
          // Link profile to default address if it's the first one
          if (addrData && isFirstAddress) {
              await supabase.from('profiles').update({ default_address_id: addrData.id }).eq('id', currentUser.id);
          }
      }

      // 2. SAVE CARD TOKEN (Simulated)
      // Only if requested AND it's a new card (no token passed)
      if (currentUser && paymentMethod === 'credit_card' && saveCard && !cardToken) {
          // Simulate Tokenization from Gateway
          const mockToken = `tok_${Math.random().toString(36).substr(2, 9)}`;
          const mockLast4 = Math.floor(1000 + Math.random() * 9000).toString();
          
          await supabase.from('user_payment_methods').insert({
              user_id: currentUser.id,
              gateway_token: mockToken, // Encrypted/Safe Reference
              last4: mockLast4,
              brand: 'Visa', // Mock
              exp_month: 12,
              exp_year: 2030,
              is_default: false 
          });
      }

      // 3. Insert Order
      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        user_id: currentUser?.id,
        items: cartItems, 
        subtotal: subtotal,
        total_amount: finalAmount, 
        discount_amount: discountAmount,
        shipping_cost: 0,
        tax_amount: 0,
        status: 'confirmed', // 'confirmed' MUST exist in order_statuses table
        payment_method: paymentMethod, 
        shipping_address_snapshot: addressData, 
        internal_logistics: logisticsInfo 
      }).select().single();

      if (orderError) throw orderError;

      // 4. Update Stock (Variants & Assets)
      for (const item of cartItems) {
         const product = products.find(p => p.id === item.product_id);
         const variant = product?.variants?.find(v => v.id === item.variant_id);
         
         if (variant) {
            await supabase.from('product_variants').update({ 
               stock_quantity: Math.max(0, variant.stock_quantity - item.quantity) 
            }).eq('id', variant.id);

            if (variant.correlated_assets) {
                for (const link of variant.correlated_assets) {
                    const totalAssetNeeded = link.quantity_required * item.quantity;
                    const asset = assets.find(a => a.id === link.asset_id);
                    if (asset) {
                        await supabase.from('assets').update({
                            stock_quantity: Math.max(0, asset.stock_quantity - totalAssetNeeded)
                        }).eq('id', asset.id);
                    }
                }
            }
         }
      }

      // 5. Prepare Success Data
      const fullOrder: Order = { 
          ...orderData, 
          items: cartItems, 
          total: finalAmount, 
          subtotal: subtotal, 
          discount_amount: discountAmount,
          payment_method: paymentMethod
      }; 
      setLastSuccessOrder(fullOrder);
      
      // 6. Trigger Success Animation (Overlay)
      setCartItems([]);
      fetchStoreData(); 
      // Refresh User Profile to get new saved card/address
      if (currentUser) fetchProfile(currentUser.id);
      
      setOrderResult({ status: 'success', orderId: orderData.id, fullOrder: fullOrder });

    } catch (err: any) {
      console.error(err);
      setOrderResult({ status: 'error', message: err.message });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleCloseOrderResult = () => {
      const wasSuccess = orderResult?.status === 'success';
      const order = orderResult?.fullOrder;
      setOrderResult(null);
      
      if (wasSuccess && order) {
          handleNavigate('receipt'); 
      }
  };

  const addToCart = useCallback((cartItem: CartItem) => {
    const product = products.find(p => p.id === cartItem.product_id);
    const variant = product?.variants?.find(v => v.id === cartItem.variant_id);
    const maxStock = variant?.stock_quantity || 0;
    
    // Check if input itself exceeds limit (Basic check)
    if (cartItem.quantity > maxStock) {
        showToast("Estoque insuficiente para a quantidade selecionada.", "error");
        return;
    }

    // Check against existing quantity in cart (Cumulative check)
    const existingItem = cartItems.find(item => item.variant_id === cartItem.variant_id);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const proposedTotal = currentQtyInCart + cartItem.quantity;

    if (proposedTotal > maxStock) {
        showToast(`Limite atingido! Você tem ${currentQtyInCart} na sacola. Restam apenas ${Math.max(0, maxStock - currentQtyInCart)} disponíveis.`, "error");
        return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.variant_id === cartItem.variant_id);
      if (existing) {
        return prev.map(item => item.variant_id === cartItem.variant_id 
          ? { ...item, quantity: item.quantity + cartItem.quantity } 
          : item
        );
      }
      return [...prev, cartItem];
    });
    setIsCartOpen(true);
  }, [products, cartItems]);

  const handleUpdateQuantity = (id: string, delta: number) => {
      setCartItems(prev => {
          return prev.map(item => {
              if (item.variant_id === id) {
                  // Find current live stock limit
                  const product = products.find(p => p.id === item.product_id);
                  const variant = product?.variants?.find(v => v.id === item.variant_id);
                  const maxStock = variant?.stock_quantity || 0;
                  
                  // Check if incrementing goes beyond stock
                  if (delta > 0 && item.quantity + delta > maxStock) {
                      showToast(`Estoque máximo atingido (${maxStock} un).`, "error");
                      return item; // Do not update
                  }
                  
                  // Allow decrement or valid increment
                  return { ...item, quantity: Math.max(1, item.quantity + delta) };
              }
              return item;
          });
      });
  };

  const handleToggleWishlist = (id: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setWishlistIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBuyAllWishlist = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    const wishlistedProducts = products.filter(p => wishlistIds.includes(p.id));
    wishlistedProducts.forEach(product => {
      const variant = product.variants?.[0];
      if (variant) {
        addToCart({
          variant_id: variant.id,
          product_id: product.id,
          name: product.name,
          image: variant.variant_images[0] || product.base_images[0],
          size: variant.size || 'N/A',
          color_name: variant.color_name,
          color_hex: variant.color_hex || '#000',
          price: userMode === UserMode.RETAIL ? variant.retail_price : variant.wholesale_price,
          quantity: 1,
          sku: variant.sku
        });
      }
    });
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 20);
  };

  if (currentView === 'admin') {
    return <AdminDashboard onLogout={exitAdmin} t={t} locale={locale} onProductChange={fetchStoreData} />;
  }

  // RECEIPT VIEW (Isolated)
  if (currentView === 'receipt' && lastSuccessOrder) {
      return <OrderReceipt order={lastSuccessOrder} onBack={() => handleNavigate('home')} t={t} locale={locale} />;
  }

  return (
    <div>oi</div>
  );
};
