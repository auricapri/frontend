/**
 * API Singletons
 *
 * Este arquivo exporta instâncias únicas de todas as APIs para evitar
 * a criação de múltiplas instâncias em cada render de componente.
 *
 * USO:
 * import { productsApi, ordersApi } from '@/api/instances';
 *
 * NÃO FAÇA:
 * const api = new ProductsApi(); // Cria nova instância a cada render
 */

// Core APIs
import { ProductsApi } from './products.api';
import { OrdersApi } from './orders.api';
import { UsersApi } from './users.api';
import { StoreApi } from './store.api';
import { AuthApi } from './auth.api';

// Commerce APIs
import { CartApi } from './cart.api';
import { CouponsApi } from './coupons.api';
import { CollectionsApi } from './collections.api';
import { AssetsApi } from './assets.api';
import { PricingApi } from './pricing.api';

// Content APIs
import { BannersApi } from './banners.api';
import { GuidesApi } from './guides.api';
import { WishlistApi } from './wishlist.api';
import { FAQApi } from './faq.api';

// Order Management APIs
import { ShipmentsApi } from './shipments.api';
import { PaymentsApi } from './payments.api';
import { ReturnsApi } from './returns.api';
import { DeliveryApi } from './delivery.api';
import { NotificationsApi } from './notifications.api';

// Reviews APIs
import { ProductReviewsApi } from './product-reviews.api';
import { OrderReviewsApi } from './order-reviews.api';

// Other APIs
import { SuppliersApi } from './suppliers.api';
import { MarketingApi } from './marketing.api';
import { UserConsentsApi } from './user_consents.api';
import { DreamApi } from './dream.api';
import { AiChatApi } from './ai-chat.api';
import { FaceSwapApi } from './face-swap.api';

// Cached APIs (já têm cache interno)
import { CachedProductsApi } from './cached.products.api';
import { CachedStoreApi } from './cached.store.api';
import { CachedCollectionsApi } from './cached.collections.api';
import { CachedCouponsApi } from './cached.coupons.api';
import { CachedAssetsApi } from './cached.assets.api';

// ============================================
// SINGLETONS - Core APIs
// ============================================
export const productsApi = new ProductsApi();
export const ordersApi = new OrdersApi();
export const usersApi = new UsersApi();
export const storeApi = new StoreApi();
export const authApi = new AuthApi();

// ============================================
// SINGLETONS - Commerce APIs
// ============================================
export const cartApi = new CartApi();
export const couponsApi = new CouponsApi();
export const collectionsApi = new CollectionsApi();
export const assetsApi = new AssetsApi();
export const pricingApi = new PricingApi();

// ============================================
// SINGLETONS - Content APIs
// ============================================
export const bannersApi = new BannersApi();
export const guidesApi = new GuidesApi();
export const wishlistApi = new WishlistApi();
export const faqApi = new FAQApi();

// ============================================
// SINGLETONS - Order Management APIs
// ============================================
export const shipmentsApi = new ShipmentsApi();
export const paymentsApi = new PaymentsApi();
export const returnsApi = new ReturnsApi();
export const deliveryApi = new DeliveryApi();
export const notificationsApi = new NotificationsApi();

// ============================================
// SINGLETONS - Reviews APIs
// ============================================
export const productReviewsApi = new ProductReviewsApi();
export const orderReviewsApi = new OrderReviewsApi();

// ============================================
// SINGLETONS - Other APIs
// ============================================
export const suppliersApi = new SuppliersApi();
export const marketingApi = new MarketingApi();
export const userConsentsApi = new UserConsentsApi();
export const dreamApi = new DreamApi();
export const aiChatApi = new AiChatApi();
export const faceSwapApi = new FaceSwapApi();

// ============================================
// SINGLETONS - Cached APIs (preferir estas!)
// ============================================
export const cachedProductsApi = new CachedProductsApi();
export const cachedStoreApi = new CachedStoreApi();
export const cachedCollectionsApi = new CachedCollectionsApi();
export const cachedCouponsApi = new CachedCouponsApi();
export const cachedAssetsApi = new CachedAssetsApi();
