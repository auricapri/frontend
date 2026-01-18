/**
 * API Client for backend communication
 * Adapted for React Native (removed web-specific APIs)
 */

import RNFS from 'react-native-fs';
import { Platform, PermissionsAndroid } from 'react-native';

// Always use production API URL
// No local backend - always use the production API
const getApiBaseUrl = () => {
  // Production API URL
  const PROD_API_URL = 'https://backend-yso8.onrender.com/api';
  
  // Always use production API, regardless of build mode or platform
  return PROD_API_URL;
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiError {
  error: {
    message: string;
    code?: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    // Get token from Supabase session
    try {
      const { supabase } = require('../utils/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error: unknown) {
      // Handle network errors (connection refused, timeout, etc.)
      const errorMessage = error instanceof Error ? error.message : 'Network request failed';
      console.error(`Network error for ${this.baseUrl}${endpoint}:`, errorMessage);
      throw new Error(`Network request failed: ${errorMessage}. Please check your internet connection and ensure the API server is running.`);
    }

    // Handle CORS errors and network failures
    if (!response.ok) {
      // Read error as text first to avoid JSON parsing errors
      const errorText = await response.text().catch(() => '');
      let error: ApiError;
      try {
        error = JSON.parse(errorText);
      } catch {
        // If not JSON, create error from status
        error = {
          error: { 
            message: `HTTP ${response.status}: ${response.statusText}. ${errorText ? errorText.substring(0, 100) : 'Network error'}` 
          },
        };
      }
      throw new Error(error.error.message);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return null as T;
    }

    // Try to parse JSON, but handle empty responses
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null as T;
    }
    
    // Check if response is HTML (backend error page)
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error('Backend returned HTML instead of JSON. The API endpoint may be incorrect or the backend is not running.');
    }
    
    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Download file (e.g., PDF) - Adapted for React Native
   */
  async downloadFile(endpoint: string, filename: string): Promise<string> {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Request storage permission on Android
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Storage permission denied');
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    // Get download path
    const downloadPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
    
    // Download file using react-native-fs
    const result = await RNFS.downloadFile({
      fromUrl: `${this.baseUrl}${endpoint}`,
      toFile: downloadPath,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).promise;

    if (result.statusCode === 200) {
      return downloadPath;
    } else {
      throw new Error(`Download failed with status: ${result.statusCode}`);
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

