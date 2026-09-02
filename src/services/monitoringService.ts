/**
 * Kixora Monitoring & Error Reporting Service
 */
import { sanitizeDataForLogging } from '../utils/security';

export interface ErrorContext {
  userId?: string;
  orderCode?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

class MonitoringService {
  private isProduction = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') || (typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD);

  /**
   * Reports an error to the production monitoring system (abstraction).
   */
  public reportError(error: Error | string, context: ErrorContext = {}): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;

    // 1. Sanitize context and error message
    const sanitizedContext = sanitizeDataForLogging(context);
    const sanitizedMessage = sanitizeDataForLogging(errorMessage);

    // 2. Prepare payload
    const payload = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: sanitizedMessage,
      context: sanitizedContext,
      // Stack trace is excluded in production reporting to customers/logs if sensitive,
      // but usually kept in internal reporting. Here we follow the rule of not exposing it to customers.
      stack: this.isProduction ? undefined : errorStack, 
      environment: (typeof process !== 'undefined' && process.env?.NODE_ENV) || (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE) || 'development',
    };

    // 3. Dispatch (Mocking production endpoint dispatch)
    if (this.isProduction) {
      // In a real app: fetch('https://monitoring.kixora.com/api/errors', { method: 'POST', body: JSON.stringify(payload) })
      console.error('[PRODUCTION-MONITORING]:', JSON.stringify(payload));
    } else {
      console.error('[DEV-MONITORING]:', payload);
    }
  }

  /**
   * Reports a non-critical warning.
   */
  public reportWarning(message: string, context: ErrorContext = {}): void {
    const sanitizedContext = sanitizeDataForLogging(context);
    const sanitizedMessage = sanitizeDataForLogging(message);

    const payload = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message: sanitizedMessage,
      context: sanitizedContext,
    };

    if (this.isProduction) {
      console.warn('[PRODUCTION-MONITORING]:', JSON.stringify(payload));
    } else {
      console.warn('[DEV-MONITORING]:', payload);
    }
  }
}

export const monitoringService = new MonitoringService();
