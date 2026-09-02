/**
 * KIXORA PII MASKING SPECIFICATION (Production-Ready)
 * 
 * POLICY: Full Redaction approach for maximum security posture
 * - Emails: Show domain only, redact local part
 * - Phones: Show country code only, redact all digits
 * - Names: Full redaction
 * - Addresses: Full redaction
 */

export function maskPII(value: string): string {
  if (!value || typeof value !== 'string') return '[REDACTED]';

  if (value.includes('@')) {
    const [, domain] = value.split('@');
    return `[REDACTED]@${domain}`;
  }

  if (value.startsWith('+') || /^\d{7,}$/.test(value.replace(/\D/g, ''))) {
    const countryCode = value.match(/^\+?\d{1,3}/)?.[0] || '+XX';
    return `${countryCode}-[REDACTED]`;
  }

  return '[REDACTED]';
}

export function sanitizeDataForLogging(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'email', 'phone', 'fullName', 'full_name',
    'address', 'street', 'zip', 'trackingNumber',
    'tracking_number', 'clientSecret', 'client_secret',
    'customer_snapshot', 'payment_reference'
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (sensitiveFields.includes(key)) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = maskPII(sanitized[key]);
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeDataForLogging(sanitized[key]);
    }
  }

  return sanitized;
}

export function scrubPaymentMetadata(metadata: any): any {
  if (!metadata || typeof metadata !== 'object') return metadata;

  const scrubbed = { ...metadata };
  const sensitiveKeys = ['card', 'cvc', 'exp_month', 'exp_year', 'number', 'client_secret'];

  for (const key of sensitiveKeys) {
    if (key in scrubbed) {
      scrubbed[key] = '[REDACTED]';
    }
  }

  return scrubbed;
}
