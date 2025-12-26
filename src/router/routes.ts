export type View = 'home' | 'product' | 'collection' | 'admin' | 'checkout' | 'receipt' | 'about' | 'reset-password' | 'shared-wishlist';

export interface Route {
  view: View;
  path?: string;
}

export const routes: Record<View, Route> = {
  home: { view: 'home', path: '/' },
  product: { view: 'product', path: '/product' },
  collection: { view: 'collection', path: '/collection' },
  admin: { view: 'admin', path: '/admin' },
  checkout: { view: 'checkout', path: '/checkout' },
  receipt: { view: 'receipt', path: '/receipt' },
  about: { view: 'about', path: '/about' },
  'reset-password': { view: 'reset-password', path: '/reset-password' },
  'shared-wishlist': { view: 'shared-wishlist', path: '/wishlist' }
};

