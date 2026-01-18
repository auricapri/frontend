import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  target_segments: any;
  weather_conditions: any;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserTag {
  id?: string;
  user_id: string;
  tag: string;
  score: number;
  source: string;
  last_seen_at?: string;
  interaction_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignInteraction {
  id?: string;
  campaign_id: string;
  user_id: string | null;
  session_id: string | null;
  interaction_type: 'sent' | 'opened' | 'clicked' | 'converted';
  source: 'weather_recommendation' | 'campaign' | 'organic';
  metadata?: any;
  created_at?: string;
}

export class CampaignsRepository {
  async getActiveCampaigns(): Promise<Campaign[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting active campaigns', { error });
      return [];
    }
  }

  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign | null> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaign])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating campaign', { error });
      return null;
    }
  }

  async updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign | null> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update(campaign)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating campaign', { id, error });
      return null;
    }
  }

  async getCampaignById(id: string): Promise<Campaign | null> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error) {
      logger.error('Error getting campaign by id', { id, error });
      return null;
    }
  }

  async getUserTags(userId: string): Promise<UserTag[]> {
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .select('*')
        .eq('user_id', userId)
        .order('score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting user tags', { userId, error });
      return [];
    }
  }

  async upsertUserTag(tag: UserTag): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_tags')
        .upsert(tag, { onConflict: 'user_id,tag' });

      if (error) throw error;
    } catch (error) {
      logger.error('Error upserting user tag', { tag, error });
    }
  }

  async recordInteraction(interaction: CampaignInteraction): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaign_interactions')
        .insert([interaction]);

      if (error) throw error;
    } catch (error) {
      logger.error('Error recording campaign interaction', { interaction, error });
    }
  }

  async getCampaignAnalytics(campaignId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('campaign_interactions')
        .select('interaction_type')
        .eq('campaign_id', campaignId);

      if (error) throw error;
      
      const counts = data.reduce((acc: any, curr: any) => {
        acc[curr.interaction_type] = (acc[curr.interaction_type] || 0) + 1;
        return acc;
      }, {});

      return counts;
    } catch (error) {
      logger.error('Error getting campaign analytics', { campaignId, error });
      return null;
    }
  }
}

let singleton: CampaignsRepository | null = null;
export function getCampaignsRepository(): CampaignsRepository {
  if (!singleton) singleton = new CampaignsRepository();
  return singleton;
}
