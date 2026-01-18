/**
 * API Singletons para Mobile
 *
 * Este arquivo exporta instâncias únicas de todas as APIs para evitar
 * a criação de múltiplas instâncias em cada render de componente.
 */

import { ProductsApi } from './products.api';
import { StoreApi } from './store.api';
import { CollectionsApi } from './collections.api';
import { CouponsApi } from './coupons.api';
import { AssetsApi } from './assets.api';
import { OrdersApi } from './orders.api';
import { UsersApi } from './users.api';
import { AuthApi } from './auth.api';
import { WishlistApi } from './wishlist.api';
import { NotificationsApi } from './notifications.api';
import { ProductReviewsApi } from './product-reviews.api';

// Singletons
export const productsApi = new ProductsApi();
export const storeApi = new StoreApi();
export const collectionsApi = new CollectionsApi();
export const couponsApi = new CouponsApi();
export const assetsApi = new AssetsApi();
export const ordersApi = new OrdersApi();
export const usersApi = new UsersApi();
export const authApi = new AuthApi();
export const wishlistApi = new WishlistApi();
export const notificationsApi = new NotificationsApi();
export const productReviewsApi = new ProductReviewsApi();
