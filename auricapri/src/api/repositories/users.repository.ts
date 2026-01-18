import { UserProfile, SavedAddress } from '../../types';
import { UsersApi } from '../users.api';

export class UsersRepository {
  private api: UsersApi;

  constructor() {
    this.api = new UsersApi();
  }

  async getAll(): Promise<UserProfile[]> {
    return this.api.getAll();
  }

  async getById(id: string): Promise<UserProfile | null> {
    return this.api.getById(id);
  }

  async update(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.api.updateProfile(updates);
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
    return this.api.createAddress(address);
  }

  async setDefaultAddress(addressId: string): Promise<void> {
    return this.api.setDefaultAddress(addressId);
  }
}
