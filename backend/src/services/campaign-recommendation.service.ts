import { getCampaignsRepository, Campaign, UserTag } from '../repositories/campaigns.repository.js';
import logger from '../config/logger.js';

export interface CampaignRecommendation {
  campaign: Campaign;
  score: number;
  matchingTags: string[];
  reasons: string[];
}

export class CampaignRecommendationService {
  private campaignsRepo = getCampaignsRepository();

  async getRecommendedCampaignsForUser(userId: string, limit: number = 5): Promise<CampaignRecommendation[]> {
    try {
      const [activeCampaigns, userTags] = await Promise.all([
        this.campaignsRepo.getActiveCampaigns(),
        this.campaignsRepo.getUserTags(userId)
      ]);

      if (activeCampaigns.length === 0) return [];

      const recommendations: CampaignRecommendation[] = activeCampaigns.map(campaign => {
        return this.calculateRecommendation(campaign, userTags);
      });

      // Sort by score and filter out zero scores
      return recommendations
        .filter(rec => rec.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error getting recommended campaigns for user', { userId, error });
      return [];
    }
  }

  private calculateRecommendation(campaign: Campaign, userTags: UserTag[]): CampaignRecommendation {
    const matchingTags: string[] = [];
    const reasons: string[] = [];
    let score = 0;

    // 1. Tag matching
    if (campaign.tags && campaign.tags.length > 0) {
      for (const campaignTag of campaign.tags) {
        const userTag = userTags.find(ut => ut.tag === campaignTag);
        if (userTag) {
          matchingTags.push(campaignTag);
          score += userTag.score;
          reasons.push(`Possui interesse em ${campaignTag} (score: ${userTag.score.toFixed(2)})`);
        }
      }
    }

    // 2. Normalize score by number of campaign tags if any
    if (campaign.tags && campaign.tags.length > 0 && matchingTags.length > 0) {
      score = score / campaign.tags.length;
    }

    // 3. Contextual boost (can be added here, e.g. weather conditions matching)

    return {
      campaign,
      score,
      matchingTags,
      reasons
    };
  }
}

let singleton: CampaignRecommendationService | null = null;
export function getCampaignRecommendationService(): CampaignRecommendationService {
  if (!singleton) singleton = new CampaignRecommendationService();
  return singleton;
}
