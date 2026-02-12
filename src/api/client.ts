/**
 * API Client for backend communication
 * Replaces direct Supabase calls with HTTP requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// AI API calls go through backend proxy for security (backend adds X-API-Key)
// Frontend should NOT call AI API directly - use /api/ai/* endpoints instead

export interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: Array<{
      path: string;
      message: string;
    }>;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    // Get token from Supabase session (for now, we still use Supabase Auth)
    // In the future, this could be stored in localStorage or context
    try {
      const { supabase } = await import('../utils/supabase');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth Error]', error);
        return null;
      }

      return session?.access_token || null;
    } catch (err) {
      console.error('[Auth Exception]', err);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      ...options.headers,
    };

    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      const message = error?.error?.message || error?.message || `HTTP ${response.status}: ${response.statusText}`;
      const details = error?.error?.details?.map((d: any) => `${d.path}: ${d.message}`).join(', ');
      throw new Error(details ? `${message}: ${details}` : message);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
      headers,
      ...options,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
      headers,
      ...options,
    });
  }

  async delete<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Download file (e.g., PDF)
   */
  async downloadFile(endpoint: string, filename: string): Promise<void> {
    const token = await this.getAuthToken();

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers,
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `Failed to download file: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Response wasn't JSON, use default message
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// AI clients now use backend proxy endpoints (/api/ai/*)
// This ensures proper authentication with X-API-Key header
export const aiChatClient = apiClient;
export const faceSwapClient = apiClient;
