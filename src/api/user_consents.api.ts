import { apiClient } from './client';

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: 'terms' | 'privacy' | 'marketing' | 'cookies';
  version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export class UserConsentsApi {
  async getAll(): Promise<UserConsent[]> {
    return apiClient.get<UserConsent[]>('/user-consents');
  }

  async create(data: {
    consent_type: 'terms' | 'privacy' | 'marketing' | 'cookies';
    version: string;
  }): Promise<UserConsent> {
    return apiClient.post<UserConsent>('/user-consents', data);
  }

  async check(consentType: 'terms' | 'privacy' | 'marketing' | 'cookies', version: string): Promise<{ hasConsent: boolean }> {
    return apiClient.get<{ hasConsent: boolean }>(`/user-consents/check?consentType=${consentType}&version=${version}`);
  }
}

