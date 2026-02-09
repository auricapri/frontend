/**
 * AdminOrders - Re-export from modular location for backwards compatibility
 *
 * The component has been split into:
 * - types.ts: Type definitions
 * - helpers.ts: SLA, logistics, and economics helpers
 * - OrderColumn.tsx: Reusable column wrapper
 * - columns/: Kanban columns (Approval, Expedition, Transit, History)
 * - modal-sections/: Modal sections (CustomerInfo, ConfirmationStage, etc.)
 * - OrderModal.tsx: Order detail modal
 * - AdminOrders.tsx: Main component
 */
export { default } from './admin-orders';
export * from './admin-orders';
