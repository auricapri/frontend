/// AdminEditorModal - Componentized
///
/// Admin editor modal for products, categories, collections, and banners.
///
/// Structure:
/// - AdminEditorModal.tsx (~220 lines) - Main component
/// - types.ts (~55 lines) - Types and interfaces
/// - constants.ts (~20 lines) - Category icons
/// - utils.ts (~75 lines) - Helper functions
/// - hooks/
///   - useEditorState.ts (~210 lines) - State management
///   - useProductHandlers.ts (~180 lines) - Product handlers
/// - tabs/
///   - ProductIdentityTab.tsx (~400 lines) - Product identity and variants
///   - ProductPricingTab.tsx (~350 lines) - Pricing scenarios and matrix
///   - BannerEditor.tsx (~80 lines) - Banner editor
///   - CategoryCollectionEditor.tsx (~140 lines) - Category/Collection editor
///   - PreviewTab.tsx (~90 lines) - Live preview
///
/// Total: ~1820 lines split into 12 files (all under 500 lines)

export { default } from './AdminEditorModal';
export { default as AdminEditorModal } from './AdminEditorModal';

// Types
export * from './types';

// Constants
export { CATEGORY_ICONS } from './constants';

// Utils
export { generateUUID, getLocVal, createUpdateNested, createUpdateSimple } from './utils';

// Hooks
export { useEditorState, useProductHandlers } from './hooks';

// Tabs
export {
  ProductIdentityTab,
  ProductPricingTab,
  BannerEditor,
  CategoryCollectionEditor,
  PreviewTab
} from './tabs';
