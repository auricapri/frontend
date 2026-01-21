// ⚠️ ATENÇÃO: Apenas tipos comuns usados em TODA a aplicação
// ❌ NÃO exporte tipos admin-only (dream, diagram, suppliers)
// ✅ OK exportar: common, products, orders, users, payments, reviews, store

export * from './common';
export * from './products';
export * from './orders';
export * from './users';
export * from './payments';
export * from './reviews';
export * from './store';
export type { OrderEconomics } from './pricing.types';

// ❌ Tipos removidos (use imports diretos em admin components):
// - './dream' → import { DreamBoard } from '../../types/dream'
// - './diagram' → import { DiagramData } from '../../types/diagram'
// - './suppliers' → import { Supplier } from '../../types/suppliers'
