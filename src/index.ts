// Main exports for the application

// Pages
export { HomePage } from './pages/HomePage';
export { ProductPage } from './pages/ProductPage';
export { CollectionPage } from './pages/CollectionPage';
export { CheckoutPage } from './pages/CheckoutPage';
export { AboutPage } from './pages/AboutPage';
export { ReceiptPage } from './pages/ReceiptPage';

// Router
export { Router } from './router/Router';
export { useRouter } from './router/useRouter';
export { routes } from './router/routes';
export type { View } from './router/routes';

// Contexts
export { AppProvider, useAppContext } from './context/AppContext';
export { AuthProvider, useAuthContext } from './context/AuthContext';
export { CartProvider, useCartContext } from './context/CartContext';

// Hooks
export { useStoreData } from './hooks/useStoreData';
export { useAuth } from './hooks/useAuth';
export { useCart } from './hooks/useCart';
export { useWishlist } from './hooks/useWishlist';
export { useOrders } from './hooks/useOrders';
export { useLoyalty } from './hooks/useLoyalty';
export { useNavigation } from './hooks/useNavigation';

// Services
export { CartService } from './services/cart.service';
export { StockService } from './services/stock.service';
export { LoyaltyService } from './services/loyalty.service';
export { OrderService } from './services/order.service';
export { LogisticsService } from './services/logistics.service';

// Repositories
export * from './api';

// UI Components
export { Button } from './components/ui/Button';
export { Input } from './components/ui/Input';
export { Modal } from './components/ui/Modal';
export { Drawer } from './components/ui/Drawer';

// Utils
export { formatCurrency } from './utils/currency';
export { MAPBOX_TOKEN, getMapboxStyle } from './utils/mapbox';
export { supabase } from './utils/supabase';

// Types
export * from './types';

// Constants
export * from './constants';

