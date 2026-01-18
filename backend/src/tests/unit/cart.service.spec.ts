import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartService } from '../../services/cart.service.js';
import type { CartItem } from '../../../shared/types/index.js';

// Mocks
const mockCartCache = {
  getCart: vi.fn(),
  saveCart: vi.fn(),
  deleteCart: vi.fn(),
};

const mockProductsRepo = {
  getVariantsByIds: vi.fn(),
};
const mockAssetsRepo = {
  getByIds: vi.fn(),
};

// Intercept modules
vi.mock('../../services/cart-cache.service.js', () => ({
  CartCacheService: class {
    getCart = mockCartCache.getCart;
    saveCart = mockCartCache.saveCart;
    deleteCart = mockCartCache.deleteCart;
  },
}));

vi.mock('../repositories/cart.repository.js', () => ({
  CartRepository: class {},
}));

vi.mock('../repositories/products.repository.js', () => ({
  ProductsRepository: class {
    getVariantsByIds = mockProductsRepo.getVariantsByIds;
  },
}));

vi.mock('../repositories/assets.repository.js', () => ({
  AssetsRepository: class {
    getByIds = mockAssetsRepo.getByIds;
  },
}));

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CartService();
  });

  describe('calculateSubtotal', () => {
    it('should calculate subtotal correctly', () => {
      const items: CartItem[] = [
        {
          variant_id: 'v1',
          product_id: 'p1',
          name: { pt: 'Item 1', en: 'Item 1' },
          price: 100,
          quantity: 2,
          image: '',
          size: 'M',
          color_name: { pt: 'Azul', en: 'Blue' },
          color_hex: '#0000FF',
          sku: 'SKU1',
        },
        {
          variant_id: 'v2',
          product_id: 'p2',
          name: { pt: 'Item 2', en: 'Item 2' },
          price: 50,
          quantity: 1,
          image: '',
          size: 'S',
          color_name: { pt: 'Vermelho', en: 'Red' },
          color_hex: '#FF0000',
          sku: 'SKU2',
        },
      ];

      const total = service.calculateSubtotal(items);
      expect(total).toBe(250);
    });

    it('should return 0 for empty items', () => {
      expect(service.calculateSubtotal([])).toBe(0);
    });
  });

  describe('validateStock', () => {
    it('should return valid if stock is sufficient', () => {
      const items: CartItem[] = [
        {
          variant_id: 'v1',
          product_id: 'p1',
          name: { pt: 'Item 1', en: 'Item 1' },
          price: 100,
          quantity: 2,
          image: '',
          size: 'M',
          color_name: { pt: 'Azul', en: 'Blue' },
          color_hex: '#0000FF',
          sku: 'SKU1',
        },
      ];

      const variants = [
        {
          id: 'v1',
          product_id: 'p1',
          stock_quantity: 10,
          correlated_assets: null,
          sku: 'SKU1',
          color_name: 'Blue',
          retail_price: 100,
          wholesale_price: 80,
          is_active: true,
        },
      ];

      const result = service.validateStock(items, variants as any, []);
      expect(result.valid).toBe(true);
    });

    it('should return error if stock is insufficient', () => {
      const items: CartItem[] = [
        {
          variant_id: 'v1',
          product_id: 'p1',
          name: { pt: 'Produto Teste', en: 'Test Product' },
          price: 100,
          quantity: 20,
          image: '',
          size: 'M',
          color_name: { pt: 'Azul', en: 'Blue' },
          color_hex: '#0000FF',
          sku: 'SKU1',
        },
      ];

      const variants = [
        {
          id: 'v1',
          product_id: 'p1',
          stock_quantity: 5,
          correlated_assets: null,
          sku: 'SKU1',
          color_name: 'Blue',
          retail_price: 100,
          wholesale_price: 80,
          is_active: true,
        },
      ];

      const result = service.validateStock(items, variants as any, []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Estoque insuficiente');
    });
  });
});
