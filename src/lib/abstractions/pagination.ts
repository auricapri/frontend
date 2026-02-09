/**
 * Pagination Types and Utilities for Frontend
 */

export type SortDirection = 'asc' | 'desc';

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortDirection?: SortDirection;
}

/**
 * Paginated response from API
 */
export interface PagedResult<T> {
  /** Items for the current page */
  data: T[];
  /** Total number of items */
  total: number;
  /** Number of items returned */
  limit: number;
  /** Offset used */
  offset: number;
  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * Pagination state for UI components
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Convert page/pageSize to limit/offset
 */
export function toApiPagination(params: PaginationParams): { limit: number; offset: number } {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

/**
 * Create pagination state from API response
 */
export function createPaginationState<T>(
  result: PagedResult<T>,
  currentPage: number
): PaginationState {
  const pageSize = result.limit;
  const totalPages = Math.ceil(result.total / pageSize);

  return {
    currentPage,
    pageSize,
    totalItems: result.total,
    totalPages,
    hasNextPage: result.hasMore,
    hasPreviousPage: currentPage > 1,
  };
}

/**
 * Empty paged result
 */
export function emptyPagedResult<T>(): PagedResult<T> {
  return {
    data: [],
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  };
}

/**
 * Get page numbers for pagination UI
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
