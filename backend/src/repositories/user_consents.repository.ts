import { supabase } from '../config/supabase.js';

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: 'terms' | 'privacy' | 'marketing' | 'cookies';
  version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export class UserConsentsRepository {
  async create(data: {
    user_id: string;
    consent_type: 'terms' | 'privacy' | 'marketing' | 'cookies';
    version: string;
    ip_address?: string | null;
    user_agent?: string | null;
  }): Promise<UserConsent> {
    const { data: consent, error } = await supabase
      .from('user_consents')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return consent as UserConsent;
  }

  async getByUserId(userId: string): Promise<UserConsent[]> {
    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .order('accepted_at', { ascending: false });

    if (error) throw error;
    return (data || []) as UserConsent[];
  }

  async hasConsent(userId: string, consentType: 'terms' | 'privacy' | 'marketing' | 'cookies', version: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_consents')
      .select('id')
      .eq('user_id', userId)
      .eq('consent_type', consentType)
      .eq('version', version)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }
}

