
import { CartItem } from '../types';

describe('Shared Wishlist Checkout Flow', () => {
  const mockProducts = [
    {
      id: 'p1',
      name: { pt: 'Produto 1', en: 'Product 1' },
      variants: [{ id: 'v1', price: 100, stock_quantity: 10 }]
    },
    {
      id: 'p2',
      name: { pt: 'Produto 2', en: 'Product 2' },
      variants: [{ id: 'v2', price: 200, stock_quantity: 5 }]
    }
  ];

  test('should correctly build cart items from products', () => {
    const cartItems: CartItem[] = mockProducts.map(product => {
      const variant = product.variants[0];
      return {
        variant_id: variant.id,
        product_id: product.id,
        name: product.name,
        image: '',
        size: 'M',
        color_name: { pt: 'Preto', en: 'Black' },
        color_hex: '#000',
        price: variant.price,
        quantity: 1,
        sku: 'SKU-1'
      };
    });

    expect(cartItems).toHaveLength(2);
    expect(cartItems[0].price).toBe(100);
    expect(cartItems[1].price).toBe(200);
  });

  test('should filter individual item for checkout', () => {
    const cartItems: CartItem[] = [
      { product_id: 'p1', variant_id: 'v1', price: 100, quantity: 1 } as any,
      { product_id: 'p2', variant_id: 'v2', price: 200, quantity: 1 } as any
    ];

    const selectedProductId = 'p1';
    const itemsToCheckout = cartItems.filter(i => i.product_id === selectedProductId);

    expect(itemsToCheckout).toHaveLength(1);
    expect(itemsToCheckout[0].product_id).toBe('p1');
  });

  test('should calculate correct subtotal for subset of items', () => {
    const itemsToCheckout: CartItem[] = [
      { price: 100, quantity: 2 } as any,
      { price: 50, quantity: 1 } as any
    ];

    const subtotal = itemsToCheckout.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    expect(subtotal).toBe(250);
  });
});
