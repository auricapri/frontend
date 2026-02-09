/// AdminEditorModal
///
/// Re-exports the modular AdminEditorModal from the AdminEditorModal/ folder.
/// All functionality is now componentized in separate files:
///
/// - AdminEditorModal.tsx (~220 lines) - Main component
/// - types.ts (~55 lines) - Types and interfaces
/// - constants.ts (~20 lines) - Category icons
/// - utils.ts (~75 lines) - Helper functions
/// - hooks/useEditorState.ts (~210 lines) - State management
/// - hooks/useProductHandlers.ts (~180 lines) - Product handlers
/// - tabs/ProductIdentityTab.tsx (~400 lines) - Product identity and variants
/// - tabs/ProductPricingTab.tsx (~350 lines) - Pricing scenarios and matrix
/// - tabs/BannerEditor.tsx (~80 lines) - Banner editor
/// - tabs/CategoryCollectionEditor.tsx (~140 lines) - Category/Collection editor
/// - tabs/PreviewTab.tsx (~90 lines) - Live preview
///
/// Total: ~1820 lines split into 12 files (all under 500 lines)

export { default } from './AdminEditorModal/index';
export * from './AdminEditorModal/index';
