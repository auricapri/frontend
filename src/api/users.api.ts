import { apiClient } from './client';
import { UserProfile, SavedAddress, SavedCard } from '../types';
import type { UserLoyaltyData } from '../types/users/loyalty';

export class UsersApi {
  async getProfile(_userId: string): Promise<UserProfile | null> {
    // Backend returns current user profile
    return apiClient.get<UserProfile | null>('/users/profile');
  }

  async getAll(): Promise<UserProfile[]> {
    return apiClient.get<UserProfile[]>('/users');
  }

  async getById(userId: string): Promise<UserProfile | null> {
    return apiClient.get<UserProfile | null>(`/users/${userId}`);
  }

  async createDeliveryUser(userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }): Promise<UserProfile> {
    return apiClient.post<UserProfile>('/users/delivery', userData);
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/users/profile', updates);
  }

  async createAddress(address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
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
    is_default: boolean;
  }): Promise<SavedCard> {
    // This endpoint might need to be created in backend
    throw new Error('savePaymentMethod not yet implemented via API');
  }

  async updateLoyalty(loyalty: UserLoyaltyData): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/users/loyalty', { loyalty });
  }
}
