
/**
 * Utility for handling affiliate links and product deep links
 */

export interface AffiliateInfo {
  affiliateId: string;
  campaignId?: string;
  source?: string;
  medium?: string;
}

/**
 * Parses a URL for affiliate and campaign parameters
 */
export const parseAffiliateParams = (url: string): AffiliateInfo | null => {
  try {
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;
    
    const affiliateId = params.get('aff') || params.get('ref') || params.get('affiliate_id');
    
    if (!affiliateId) return null;
    
    return {
      affiliateId,
      campaignId: params.get('campaign') || params.get('utm_campaign') || undefined,
      source: params.get('source') || params.get('utm_source') || undefined,
      medium: params.get('medium') || params.get('utm_medium') || undefined
    };
  } catch (_e) {
    return null;
  }
};

/**
 * Normalizes a product URL to ensure it has all required tracking parameters
 */
export const normalizeProductUrl = (baseUrl: string, affiliateId?: string): string => {
  try {
    const url = new URL(baseUrl);
    if (affiliateId) {
      url.searchParams.set('aff', affiliateId);
    }
    // Add default source if missing
    if (!url.searchParams.has('utm_source')) {
      url.searchParams.set('utm_source', 'auricapri_internal');
    }
    return url.toString();
  } catch (_e) {
    return baseUrl;
  }
};

/**
 * Simple logging for URL failures
 */
export const logUrlFailure = (url: string, error: string) => {
  const logData = {
    url,
    error,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: navigator.platform
  };
  
  console.error('[URL_FAILURE]', logData);
  
  // In a real app:
  // fetch('/api/logs/url-failure', { method: 'POST', body: JSON.stringify(logData) });
};
