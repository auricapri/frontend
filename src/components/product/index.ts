// ❌ Não exporte ProductGrid, ProductDetail, CollectionDetail aqui!
// ⚠️ Esses componentes usam lazy loading e devem ser importados diretamente
//
// ✅ Use imports diretos:
// import ProductGrid from './components/product/ProductGrid';
// import ProductDetail from './components/product/ProductDetail';
//
// Componentes menores ok para barrel export:
export { default as ProductReviews } from './ProductReviews';

