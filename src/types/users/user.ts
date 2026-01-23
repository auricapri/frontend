import { SavedAddress } from './address';
import { SavedCard } from './card';
import { UserLoyaltyData } from './loyalty';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  cpf?: string;
  affiliate_code?: string;
  avatar_url?: string;
  role: 'admin' | 'customer' | 'editor' | 'affiliate';
  default_address?: SavedAddress;
  saved_cards?: SavedCard[];
  loyalty?: UserLoyaltyData;
}
