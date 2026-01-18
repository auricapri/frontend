import { apiClient } from './client';

export interface SignUpData {
  email: string;
  password: string;
  metadata?: Record<string, any>;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: any;
  session: any;
  profile?: any;
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

