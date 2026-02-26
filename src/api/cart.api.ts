import { CartItem } from '../types';

export interface CartSession {
  id: string;
  session_key: string;
  user_id?: string | null;
  items: CartItem[];
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
}

function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'auricapri_cart_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
}

async function getCartHeaders(): Promise<HeadersInit> {
  const sessionId = getOrCreateSessionId();
  const headers: HeadersInit = {
    'X-Session-Id': sessionId,
  };

  try {
    const { supabase } = await import('../utils/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (_) {
    // Not authenticated — proceed without auth header
  }

  return headers;
}

export class CartApi {
  async getCart(): Promise<CartSession> {
    const headers = await getCartHeaders();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
    
    const response = await fetch(`${baseUrl}/cart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}: ${response.statusText}` } }));
      throw new Error(error.error.message);
    }

    return response.json();
  }

  async addItem(item: CartItem): Promise<CartSession> {
    const headers = await getCartHeaders();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
    
    const response = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ item }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}: ${response.statusText}` } }));
      throw new Error(error.error.message);
    }

    return response.json();
  }

  async updateItem(variantId: string, quantity: number): Promise<CartSession> {
    const headers = await getCartHeaders();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
    
    const response = await fetch(`${baseUrl}/cart/items/${variantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}: ${response.statusText}` } }));
      throw new Error(error.error.message);
    }

    return response.json();
  }

  async removeItem(variantId: string): Promise<CartSession> {
    const headers = await getCartHeaders();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
    
    const response = await fetch(`${baseUrl}/cart/items/${variantId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}: ${response.statusText}` } }));
      throw new Error(error.error.message);
    }

    return response.json();
  }

  async clearCart(): Promise<void> {
    const headers = await getCartHeaders();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
    
    const response = await fetch(`${baseUrl}/cart`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}: ${response.statusText}` } }));
      throw new Error(error.error.message);
    }
  }

  async mergeCart(sessionId: string): Promise<CartSession> {
    const headers = await getCartHeaders();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

    const response = await fetch(`${baseUrl}/cart/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}: ${response.statusText}` } }));
      throw new Error(error.error.message);
    }

    return response.json();
  }

  async loadCartByToken(cartToken: string): Promise<{
    items: CartItem[];
    customer: Record<string, unknown> | null;
    address: Record<string, unknown> | null;
    cart_total: number;
    discount_amount: number;
  }> {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

    const response = await fetch(`${baseUrl}/cart/sessions/${cartToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Cart session not found or expired');
    }

    return response.json();
  }
}
