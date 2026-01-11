import { Product, Category, Collection, Banner, Coupon, UserMode, UserProfile, SizeGuide, CartItem, InternalLogisticsInfo, StoreConfig, Order, AddressData } from './index';
import { Locale } from '../i18n';

export interface HomePageProps {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  banners: Banner[];
  coupons: Coupon[];
  userMode: UserMode;
  wishlistIds: string[];
  onSelectProduct: (product: Product) => void;
  onSelectCollection: (collection: Collection) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (view: string, section?: string) => void;
  onOpenLegal: (view: 'terms' | 'privacy' | null) => void;
  t: (key: string) => string;
  locale: Locale;
  onChangeLocale: (locale: Locale) => void;
  storeConfig: StoreConfig;
  isLoading: boolean;
}

export interface ProductPageProps {
  product: Product;
  coupons: Coupon[];
  userMode: UserMode;
  isWishlisted: boolean;
  currentUser: UserProfile | null;
  sizeGuides: SizeGuide[];
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
  onToggleWishlist: (productId: string) => void;
  onShowToast: (message: string, type?: 'info' | 'error') => void;
  t: (key: string) => string;
  locale: Locale;
}

export interface CollectionPageProps {
  collection: Collection;
  products: Product[];
  categories: Category[];
  userMode: UserMode;
  wishlistIds: string[];
  onSelectProduct: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onBack: () => void;
  locale: Locale;
}

export interface CheckoutPageProps {
  items: CartItem[];
  currentUser: UserProfile | null;
  storeConfig?: StoreConfig;
  onBack: () => void;
  onComplete: (
    address: AddressData,
    logistics: InternalLogisticsInfo,
    paymentMethod: 'credit_card' | 'pix',
    finalAmount: number,
    saveCard: boolean,
    cardToken?: string
  ) => void;
  t: (key: string) => string;
  locale: Locale;
}

export interface AdminPageProps {
  onLogout: () => void;
  onProductChange: () => void;
  t: (key: string) => string;
  locale: Locale;
}

export interface AboutPageProps {
  config: StoreConfig;
  locale: Locale;
  onBack: () => void;
}

export interface ReceiptPageProps {
  order: Order;
  t: (key: string) => string;
  locale: Locale;
  onBack: () => void;
}

export interface OrderReviewPageProps {
  orderId: string;
  onBack?: () => void;
  t: (key: string) => string;
  locale: Locale;
  storeConfig?: StoreConfig;
}
