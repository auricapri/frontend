/**
 * Storage Module
 *
 * Type-safe localStorage utilities.
 */

export {
  createStorage,
  createArrayStorage,
  createObjectStorage,
  storageAccessors,
  type StorageOptions,
} from './typed-storage';

export { createSyncManager, type SyncConfig, type SyncState } from './sync-manager';
