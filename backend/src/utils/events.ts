/**
 * Event Emitter for internal application events.
 * Used to decouple services and enable async processing.
 */
import { EventEmitter } from 'events';
import logger from '../config/logger.js';

// Type-safe event definitions
export interface ProductEvents {
  'product:created': { productId: string };
  'product:updated': { productId: string };
  'product:deleted': { productId: string };
  'stock:updated': { variantId: string; productId: string; newQuantity: number };
  'variant:created': { variantId: string; productId: string };
  'variant:updated': { variantId: string; productId: string };
}

export type EventName = keyof ProductEvents;

class TypedEventEmitter {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    // Increase max listeners for marketplace integrations
    this.emitter.setMaxListeners(20);
  }

  emit<K extends EventName>(event: K, data: ProductEvents[K]): boolean {
    logger.debug(`Event emitted: ${event}`, data);
    return this.emitter.emit(event, data);
  }

  on<K extends EventName>(event: K, listener: (data: ProductEvents[K]) => void): this {
    this.emitter.on(event, listener);
    logger.debug(`Event listener registered: ${event}`);
    return this;
  }

  once<K extends EventName>(event: K, listener: (data: ProductEvents[K]) => void): this {
    this.emitter.once(event, listener);
    return this;
  }

  off<K extends EventName>(event: K, listener: (data: ProductEvents[K]) => void): this {
    this.emitter.off(event, listener);
    return this;
  }

  removeAllListeners(event?: EventName): this {
    this.emitter.removeAllListeners(event);
    return this;
  }
}

// Singleton event emitter
export const eventEmitter = new TypedEventEmitter();
