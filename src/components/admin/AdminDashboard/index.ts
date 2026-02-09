/// Admin Dashboard - Main Export
///
/// Structure:
/// - AdminDashboard.tsx (~270 lines) - Main orchestrator
/// - types.ts (~55 lines) - Type definitions
/// - hooks/
///   - useSidebarCategories.ts (~30 lines) - Sidebar state
///   - useEditorState.ts (~90 lines) - Editor modals state
///   - useDeleteConfirm.ts (~100 lines) - Delete confirmation
///   - useAdminHandlers.ts (~230 lines) - All handler functions
/// - components/
///   - AdminSidebar.tsx (~130 lines) - Sidebar navigation
///   - DeleteConfirmationModal.tsx (~150 lines) - Delete modal
/// - utils/
///   - slugUtils.ts (~50 lines) - Slug utilities
///
/// Total: ~1105 lines split into 10 files (all under 300 lines)

export { default } from './AdminDashboard';
export * from './types';
export * from './hooks';
export * from './components';
export * from './utils';
