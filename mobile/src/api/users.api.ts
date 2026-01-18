import { apiClient } from './client';
import { UserProfile, SavedAddress, SavedCard, UserLoyaltyData } from '../types';

export class UsersApi {
  async getProfile(_userId: string): Promise<UserProfile | null> {
    // API endpoint for profile usually doesn't need ID if authenticated
    return apiClient.get<UserProfile | null>('/auth/profile');
  }

  async getAll(): Promise<UserProfile[]> {
    return apiClient.get<UserProfile[]>('/users');
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/users/profile', updates);
  }

  async createAddress(address: {
    type?: string;
    street_address: string;
    city: string;
    state_province: string;
    postal_code: string;
    country_code?: string;
    full_name?: string;
    phone?: string;
    is_default: boolean;
  }): Promise<SavedAddress> {
    return apiClient.post<SavedAddress>('/users/addresses', address);
  }

  async setDefaultAddress(addressId: string): Promise<void> {
    return apiClient.put<void>(`/users/addresses/${addressId}/default`, {});
  }

  async savePaymentMethod(_card: {
    gateway_token: string;
    last4: string;
    brand: string;
    exp_month: number;
    exp_year: number;
  }): Promise<void> {
    throw new Error('savePaymentMethod not yet implemented');
  }

  async updateLoyalty(loyalty: any): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/users/loyalty', { loyalty });
  }
}

