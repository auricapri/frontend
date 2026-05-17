import { apiClient } from './client';
import type { UserProfile } from '../types';

export interface SignUpData {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SupabaseSessionUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user?: SupabaseSessionUser;
}

export interface AuthResponse {
  user: SupabaseSessionUser;
  session: SupabaseSession;
  profile?: UserProfile;
}

export class AuthApi {
  async signUp(data: SignUpData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/signup', data);
  }

  async signIn(data: SignInData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/signin', data);
  }

  async signOut(): Promise<void> {
    return apiClient.post<void>('/auth/signout', {});
  }

  async resetPassword(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/reset-password', { email });
  }
}

