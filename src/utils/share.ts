/**
 * Share Utilities
 * Shared functions for social media sharing and clipboard operations
 * Used by ProductDetail, WishlistDrawer, and other sharing features
 */

/**
 * Supported sharing platforms
 */
export type SharePlatform = 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'copy' | 'native';

/**
 * Share options for customizing share behavior
 */
export interface ShareOptions {
  /** Text/message to share */
  text: string;
  /** URL to share */
  url?: string;
  /** Title for the shared content */
  title?: string;
  /** Platform to share to */
  platform: SharePlatform;
}

/**
 * Result of a share operation
 */
export interface ShareResult {
  /** Whether the share was successful */
  success: boolean;
  /** Error message if unsuccessful */
  error?: string;
  /** The platform that was used */
  platform: SharePlatform;
}

/**
 * Shares content to WhatsApp
 * Opens WhatsApp with pre-filled message
 *
 * @param text - The message text
 * @param url - Optional URL to append
 */
export function shareToWhatsApp(text: string, url?: string): void {
  const fullText = url ? `${text}\n${url}` : text;
  const encodedText = encodeURIComponent(fullText);
  window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

/**
 * Shares content to Facebook
 * Opens Facebook share dialog with URL
 *
 * @param url - The URL to share
 */
export function shareToFacebook(url: string): void {
  const encodedUrl = encodeURIComponent(url);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
}

/**
 * Shares content to Twitter/X
 * Opens Twitter with pre-filled tweet
 *
 * @param text - The tweet text
 * @param url - Optional URL to include
 */
export function shareToTwitter(text: string, url?: string): void {
  const params = new URLSearchParams();
  params.set('text', text);
  if (url) params.set('url', url);
  window.open(`https://twitter.com/intent/tweet?${params.toString()}`, '_blank');
}

/**
 * Shares content to LinkedIn
 * Opens LinkedIn share dialog
 *
 * @param url - The URL to share
 */
export function shareToLinkedIn(url: string): void {
  const encodedUrl = encodeURIComponent(url);
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
}

/**
 * Copies text to clipboard
 * Uses modern Clipboard API with fallback
 *
 * @param text - The text to copy
 * @returns Promise resolving to success status
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Try modern Clipboard API first
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Uses native Web Share API if available
 * Falls back to copying URL if not supported
 *
 * @param options - Share options
 * @returns Promise resolving to share result
 */
export async function shareNative(options: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<ShareResult> {
  try {
    if (navigator.share) {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return { success: true, platform: 'native' };
    }

    // Fallback: copy URL to clipboard
    if (options.url) {
      const copied = await copyToClipboard(options.url);
      return {
        success: copied,
        platform: 'copy',
        error: copied ? undefined : 'Failed to copy to clipboard',
      };
    }

    return {
      success: false,
      platform: 'native',
      error: 'Web Share API not supported and no URL provided',
    };
  } catch (error) {
    // User cancelled or error occurred
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, platform: 'native', error: 'Share cancelled' };
    }
    return {
      success: false,
      platform: 'native',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main share function - shares content to specified platform
 * Handles all supported platforms with consistent interface
 *
 * @param options - Share options including platform
 * @returns Promise resolving to share result
 *
 * @example
 * // Share to WhatsApp
 * const result = await share({
 *   platform: 'whatsapp',
 *   text: 'Check out this product!',
 *   url: 'https://store.com/product/123'
 * });
 *
 * // Copy to clipboard
 * const result = await share({
 *   platform: 'copy',
 *   text: 'https://store.com/product/123'
 * });
 */
export async function share(options: ShareOptions): Promise<ShareResult> {
  const { platform, text, url, title } = options;

  try {
    switch (platform) {
      case 'whatsapp':
        shareToWhatsApp(text, url);
        return { success: true, platform };

      case 'facebook':
        if (!url) {
          return { success: false, platform, error: 'URL required for Facebook share' };
        }
        shareToFacebook(url);
        return { success: true, platform };

      case 'twitter':
        shareToTwitter(text, url);
        return { success: true, platform };

      case 'linkedin':
        if (!url) {
          return { success: false, platform, error: 'URL required for LinkedIn share' };
        }
        shareToLinkedIn(url);
        return { success: true, platform };

      case 'copy': {
        const textToCopy = url || text;
        const copied = await copyToClipboard(textToCopy);
        return {
          success: copied,
          platform,
          error: copied ? undefined : 'Failed to copy to clipboard',
        };
      }

      case 'native':
        return shareNative({ title, text, url });

      default:
        return { success: false, platform, error: `Unsupported platform: ${platform}` };
    }
  } catch (error) {
    return {
      success: false,
      platform,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Checks if native Web Share API is available
 * Useful for conditionally showing native share button
 *
 * @returns Whether Web Share API is supported
 */
export function isNativeShareSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Builds a shareable product URL with optional UTM parameters
 *
 * @param baseUrl - Base URL of the product
 * @param utmParams - Optional UTM tracking parameters
 * @returns Full URL with UTM parameters
 */
export function buildShareUrl(
  baseUrl: string,
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
  }
): string {
  if (!utmParams) return baseUrl;

  const url = new URL(baseUrl);

  if (utmParams.source) url.searchParams.set('utm_source', utmParams.source);
  if (utmParams.medium) url.searchParams.set('utm_medium', utmParams.medium);
  if (utmParams.campaign) url.searchParams.set('utm_campaign', utmParams.campaign);

  return url.toString();
}
