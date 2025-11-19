/**
 * UTIM (Universal Tracking & Identity Module)
 * Encodes customer journey data into trackable links
 */

export interface UTIMData {
  customerId: string;
  quoteId: string;
  stage: string;
  emailId: string;
  timestamp: number;
  tone?: string;
  design?: string;
  source?: string;
}

/**
 * Encode UTIM data into a base64 string
 */
export function encodeUTIM(data: UTIMData): string {
  const payload = `${data.customerId}:${data.quoteId}:${data.stage}:${data.emailId}:${data.timestamp}:${data.tone || ''}:${data.design || ''}:${data.source || ''}`;
  return Buffer.from(payload).toString('base64');
}

/**
 * Decode UTIM string back to data object
 */
export function decodeUTIM(utim: string): UTIMData | null {
  try {
    const decoded = Buffer.from(utim, 'base64').toString();
    const [customerId, quoteId, stage, emailId, timestamp, tone, design, source] = decoded.split(':');
    
    return {
      customerId,
      quoteId,
      stage,
      emailId,
      timestamp: parseInt(timestamp),
      tone: tone || undefined,
      design: design || undefined,
      source: source || undefined,
    };
  } catch (error) {
    console.error('Failed to decode UTIM:', error);
    return null;
  }
}

/**
 * Calculate engagement score based on activity
 */
export function calculateEngagementScore(openCount: number, clickCount: number): number {
  return (openCount * 1) + (clickCount * 3);
}

/**
 * Determine engagement level based on score
 */
export function getEngagementLevel(openCount: number, clickCount: number): 'hot' | 'warm' | 'cold' {
  if (clickCount >= 1) return 'hot';
  if (openCount >= 3) return 'warm';
  return 'cold';
}

/**
 * Inject UTIM into email HTML
 */
export function injectUTIMIntoEmail(html: string, utim: string, baseUrl: string): string {
  // Replace UTIM placeholders
  let processed = html.replace(/\{\{utim\}\}/g, utim);
  
  // Add tracking pixel for opens
  const trackingPixel = `<img src="${baseUrl}/api/track/open?utim=${utim}" width="1" height="1" style="display:none;" alt="" />`;
  processed = processed.replace('</body>', `${trackingPixel}</body>`);
  
  // Wrap all links with click tracking
  processed = processed.replace(
    /href="([^"]+)"/g,
    (match, url) => {
      if (url.includes('track/click') || url.includes('track/open')) {
        return match; // Don't wrap tracking URLs
      }
      return `href="${baseUrl}/api/track/click?utim=${utim}&redirect=${encodeURIComponent(url)}"`;
    }
  );
  
  return processed;
}
