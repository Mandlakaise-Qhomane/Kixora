/**
 * Kixora Analytics Service
 * Handles business event tracking with privacy-first opt-out controls.
 */
import { sanitizeDataForLogging } from '../utils/security';

export type AnalyticsEvent = 
  | 'product_view'
  | 'add_to_cart'
  | 'checkout_start'
  | 'purchase_success'
  | 'newsletter_signup';

export interface AnalyticsMetadata {
  productId?: string;
  productName?: string;
  brand?: string;
  category?: string;
  price?: number;
  currency?: string;
  cartValue?: number;
  orderId?: string;
  [key: string]: any;
}

class AnalyticsService {
  private OPT_OUT_KEY = 'kixora_analytics_opt_out';
  private isProduction = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') || (typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD);

  /**
   * Tracks a business event if the user has not opted out.
   */
  public trackEvent(event: AnalyticsEvent, metadata: AnalyticsMetadata = {}): void {
    if (this.isOptedOut()) {
      return;
    }

    // 1. Sanitize metadata (Ensure no PII or sensitive info leaks)
    const sanitizedMetadata = sanitizeDataForLogging(metadata);

    // 2. Prepare payload
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      properties: sanitizedMetadata,
    };

    // 3. Dispatch (Mocking production analytics provider dispatch)
    if (this.isProduction) {
      // In a real app: fetch('https://analytics.kixora.com/collect', { method: 'POST', body: JSON.stringify(payload) })
      console.log('[PRODUCTION-ANALYTICS]:', JSON.stringify(payload));
    } else {
      console.log('[DEV-ANALYTICS]:', payload);
    }
  }

  /**
   * Checks if the user has opted out of analytics.
   */
  public isOptedOut(): boolean {
    return localStorage.getItem(this.OPT_OUT_KEY) === 'true';
  }

  /**
   * Sets the analytics opt-out preference.
   */
  public setOptOut(optOut: boolean): void {
    localStorage.setItem(this.OPT_OUT_KEY, optOut ? 'true' : 'false');
  }
}

export const analyticsService = new AnalyticsService();
