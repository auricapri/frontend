import { supabase } from '../config/supabase.js';
import type { UserProfile } from '../../shared/types/index.js';

export type { UserProfile };

const PROFILE_SELECT_FIELDS = 'id, full_name, email, phone, affiliate_code, avatar_url, role, default_address_id, loyalty';
const ADDRESS_SELECT_FIELDS = 'id, user_id, type, street_address, city, state_province, postal_code, country_code, full_name, phone, is_default';
const PAYMENT_METHOD_SELECT_FIELDS = 'id, user_id, gateway_token, last4, brand, exp_month, exp_year, is_default';

export interface SavedAddress {
  id: string;
  user_id: string;
  type?: string;
  street_address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code?: string;
  full_name?: string;
  phone?: string;
  is_default: boolean;
}

export interface SavedCard {
  id: string;
  user_id: string;
  gateway_token: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export class UsersRepository {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT_FIELDS)
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    if (!profile) return null;
    
    let user: UserProfile = profile as UserProfile;
    
    if ((profile as { default_address_id?: string }).default_address_id) {
      const { data: addr } = await supabase
        .from('addresses')
        .select(ADDRESS_SELECT_FIELDS)
        .eq('id', (profile as { default_address_id: string }).default_address_id)
        .maybeSingle();
      
      if (addr) {
        user.default_address = {
          id: addr.id,
          line1: addr.street_address || '',
          line2: undefined,
          city: addr.city || '',
          state: addr.state_province || '',
          postal_code: addr.postal_code || '',
          country: addr.country_code || 'BR',
          is_default: addr.is_default || false
        };
      }
    }
    
    const { data: cards } = await supabase
      .from('user_payment_methods')
      .select(PAYMENT_METHOD_SELECT_FIELDS)
      .eq('user_id', userId);
    
    if (cards) user.saved_cards = cards as SavedCard[];
    
    return user;
  }

  async getAll(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT_FIELDS)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as UserProfile[];
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (!existingProfile) {
      // Profile doesn't exist, create it
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...updates
        })
        .select(PROFILE_SELECT_FIELDS)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select(PROFILE_SELECT_FIELDS)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    }
  }

  async createAddress(address: {
    user_id: string;
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
    const { data, error } = await supabase
      .from('addresses')
      .insert(address)
      .select(ADDRESS_SELECT_FIELDS)
      .single();
    
    if (error) throw error;
    return data as SavedAddress;
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ default_address_id: addressId })
      .eq('id', userId);
    
    if (error) throw error;
  }

  async savePaymentMethod(card: {
    user_id: string;
    gateway_token: string;
    last4: string;
    brand: string;
    exp_month: number;
    exp_year: number;
    is_default: boolean;
  }): Promise<SavedCard> {
    const { data, error } = await supabase
      .from('user_payment_methods')
      .insert(card)
      .select(PAYMENT_METHOD_SELECT_FIELDS)
      .single();
    
    if (error) throw error;
    return data as SavedCard;
  }

  async createUserWithRole(email: string, password: string, fullName: string, role: 'admin' | 'customer' | 'editor' | 'affiliate' | 'delivery'): Promise<{ user: { id: string; email?: string }; profile: UserProfile }> {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    const profile = await this.updateProfile(authData.user.id, {
      full_name: fullName,
      email: email,
      role: role
    });

    return {
      user: authData.user,
      profile
    };
  }
}

