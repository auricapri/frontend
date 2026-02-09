/**
 * Frontend Abstractions
 *
 * Common types and utilities for the frontend application.
 */

// Pagination
export {
  type SortDirection,
  type PaginationParams,
  type PagedResult,
  type PaginationState,
  toApiPagination,
  createPaginationState,
  emptyPagedResult,
  getPageNumbers,
} from './pagination';

// Base Entities
export {
  type HasId,
  type HasTimestamps,
  type HasActive,
  type SoftDeletable,
  type HasOrder,
  type BaseEntity,
  type UserOwnedEntity,
  type HasPrice,
  type HasStock,
  type HasImage,
  type LocalizedText,
  type HasLocalizedContent,
  type AddressData,
  type ReviewBase,
  hasId,
  hasTimestamps,
  isActive,
  isDeleted,
  hasDiscount,
  getDiscountPercentage,
  isInStock,
  isLowStock,
  getLocalizedText,
} from './base-entity';
