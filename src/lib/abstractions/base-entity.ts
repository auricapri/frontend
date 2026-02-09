/**
 * Base Entity Interfaces for Frontend
 */

/**
 * Entity with an ID
 */
export interface HasId {
  id: string;
}

/**
 * Entity with timestamps
 */
export interface HasTimestamps {
  created_at: string;
  updated_at: string;
}

/**
 * Entity that can be activated/deactivated
 */
export interface HasActive {
  is_active: boolean;
}

/**
 * Soft deletable entity
 */
export interface SoftDeletable {
  deleted_at: string | null;
}

/**
 * Entity with ordering
 */
export interface HasOrder {
  sort_order: number;
}

/**
 * Base entity combining ID and timestamps
 */
export interface BaseEntity extends HasId, HasTimestamps {}

/**
 * Entity owned by a user
 */
export interface UserOwnedEntity extends BaseEntity {
  user_id: string;
}

/**
 * Price entity fields
 */
export interface HasPrice {
  price: number;
  original_price?: number | null;
}

/**
 * Stock entity fields
 */
export interface HasStock {
  stock_quantity: number;
}

/**
 * Image entity fields
 */
export interface HasImage {
  image_url?: string | null;
  images?: string[];
}

/**
 * Localized text in multiple languages
 */
export interface LocalizedText {
  en?: string;
  pt?: string;
  es?: string;
}

/**
 * Entity with localized content
 */
export interface HasLocalizedContent {
  name: LocalizedText;
  description?: LocalizedText;
}

/**
 * Address fields
 */
export interface AddressData {
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

/**
 * Review entity base
 */
export interface ReviewBase extends UserOwnedEntity {
  rating: number;
  comment: string | null;
  helpful_count: number;
  user_name?: string;
}

// Type guards

export function hasId(obj: unknown): obj is HasId {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

export function hasTimestamps(obj: unknown): obj is HasTimestamps {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'created_at' in obj &&
    'updated_at' in obj
  );
}

export function isActive(entity: HasActive): boolean {
  return entity.is_active;
}

export function isDeleted(entity: SoftDeletable): boolean {
  return entity.deleted_at !== null;
}

export function hasDiscount(entity: HasPrice): boolean {
  return (
    entity.original_price !== null &&
    entity.original_price !== undefined &&
    entity.original_price > entity.price
  );
}

export function getDiscountPercentage(entity: HasPrice): number {
  if (!hasDiscount(entity) || !entity.original_price) return 0;
  return Math.round(((entity.original_price - entity.price) / entity.original_price) * 100);
}

export function isInStock(entity: HasStock): boolean {
  return entity.stock_quantity > 0;
}

export function isLowStock(entity: HasStock, threshold: number = 5): boolean {
  return entity.stock_quantity > 0 && entity.stock_quantity <= threshold;
}

/**
 * Get localized text for current locale
 */
export function getLocalizedText(
  text: LocalizedText | string | undefined,
  locale: 'pt' | 'en' | 'es' = 'pt'
): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale] || text.pt || text.en || '';
}
