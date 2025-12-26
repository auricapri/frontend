import { supabase } from '../../utils/supabase';
import { UserProfile, SavedAddress, SavedCard } from '../../types';

export class UsersRepository {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    if (!profile) return null;
    
    let user: UserProfile = profile as UserProfile;
    
    // Load default address if exists
    if ((profile as any).default_address_id) {
      const { data: addr } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', (profile as any).default_address_id)
        .single();
      
      if (addr) user.default_address = addr as SavedAddress;
    }
    
    // Load saved cards
    const { data: cards } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', userId);
    
    if (cards) user.saved_cards = cards as SavedCard[];
    
    return user;
  }

  async getAll(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as UserProfile[];
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserProfile;
  }

  async createAddress(address: {
    user_id: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_default: boolean;
  }): Promise<SavedAddress> {
    const { data, error } = await supabase
      .from('addresses')
      .insert(address)
      .select()
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
      .select()
      .single();
    
    if (error) throw error;
    return data as SavedCard;
  }
}

