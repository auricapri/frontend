// Main components export file
//
// ⚠️ ATENÇÃO: Este arquivo só deve exportar componentes PEQUENOS e SEMPRE USADOS
// ❌ NÃO exporte componentes lazy-loaded (product, checkout, admin)
// ✅ OK exportar: layout (navbar, footer), ui components
//
// 🚫 REMOVIDO: product, checkout, admin (quebram lazy loading)
// ✅ MANTIDO: layout, cart, auth, shared, orders, ui

export * from './layout';
export * from './cart';
export * from './auth';
export * from './shared';
export * from './orders';
export * from './ui';

// ❌ Componentes removidos (use imports diretos):
// - './product' → import ProductGrid from './components/product/ProductGrid'
// - './checkout' → import CheckoutView from './components/checkout/CheckoutViewV2'
// - './admin' → import AdminDashboard from './components/admin/AdminDashboard'

