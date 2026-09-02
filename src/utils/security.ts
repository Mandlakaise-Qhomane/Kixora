/**
 * Kixora Security & PII Sanitization Utilities
 *//**
 * Masks sensitive PII data in strings (emails, phone numbers).
 */
export function maskPII(value: string): string {
  if (!value) return '';

  // Email masking
  if (value.includes('@')) {
    const [local, domain] = value.split('@');
    if (local.length <= 2) return `***@${domain}`;
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  }

  // Phone number masking (assumes digits)
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 7) {
    return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
  }

  return '***';
}

/**
 * Sanitizes a data object to remove or mask PII fields before logging.
 */
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
        // Only mask if it looks like an email or phone number (mostly digits)
        const isEmail = sanitized[key].includes('@');
        const digits = sanitized[key].replace(/\D/g, '');
        const isPhone = digits.length >= 7 && digits.length <= 15;

        if (isEmail || isPhone) {
          sanitized[key] = maskPII(sanitized[key]);
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeDataForLogging(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Scrubs payment metadata by redacting sensitive payment card fields.
 */
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
