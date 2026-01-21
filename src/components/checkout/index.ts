// ❌ Não exporte CheckoutView, AddressForm, PaymentForm, MapPicker aqui!
// ⚠️ Esses componentes usam lazy loading e devem ser importados diretamente
//
// ✅ Use imports diretos:
// import CheckoutView from './components/checkout/CheckoutViewV2';
// import { AddressForm } from './components/checkout/AddressForm';
//
// Componentes menores ok para barrel export:
export { OrderSummary } from './OrderSummary';
export type { AddressData } from '../../types';
