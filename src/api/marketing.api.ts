import { apiClient } from './client';

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export interface UserTag {
  tag: string;
  score: number;
  source: string;
}

export interface CampaignRecommendation {
  campaign: Campaign;
  score: number;
  matchingTags: string[];
  reasons: string[];
}

export class MarketingApi {
  async getMyCampaigns(): Promise<CampaignRecommendation[]> {
    return apiClient.get('/marketing/my-campaigns');
  }

  async getMyTags(): Promise<UserTag[]> {
    return apiClient.get('/marketing/my-tags');
  }

  // Admin Endpoints
  async getCampaigns(): Promise<Campaign[]> {
    return apiClient.get('/marketing/campaigns');
  }

  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    return apiClient.post('/marketing/campaigns', campaign);
  }

  async updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign> {
    return apiClient.put(`/marketing/campaigns/${id}`, campaign);
  }

  async deleteCampaign(id: string): Promise<void> {
    return apiClient.delete(`/marketing/campaigns/${id}`);
  }

  async getUserMarketingProfile(userId: string): Promise<any> {
    return apiClient.get(`/marketing/users/${userId}/profile`);
  }

  async recalculateUserTags(userId: string): Promise<void> {
    return apiClient.post(`/marketing/users/${userId}/recalculate-tags`, {});
  }
}

export const marketingApi = new MarketingApi();
