import { test, expect } from '@playwright/test';
import { maskPII, sanitizeDataForLogging, scrubPaymentMetadata } from '../../src/utils/security';

test.describe('Kixora: PII Sanitization Logic', () => {
  test('maskPII should mask emails correctly', () => {
    expect(maskPII('test@example.com')).toBe('t**t@example.com');
    expect(maskPII('ab@example.com')).toBe('***@example.com');
  });

  test('maskPII should mask phone numbers correctly', () => {
    expect(maskPII('0123456789')).toBe('******6789');
  });

  test('sanitizeDataForLogging should redact and mask sensitive fields', () => {
    const data = {
      email: 'test@example.com',
      phone: '0123456789',
      fullName: 'John Doe',
      nonSensitive: 'public_value'
    };
    const sanitized = sanitizeDataForLogging(data);
    expect(sanitized.email).toBe('t**t@example.com');
    expect(sanitized.phone).toBe('******6789');
    expect(sanitized.fullName).toBe('***');
    expect(sanitized.nonSensitive).toBe('public_value');
  });

  test('scrubPaymentMetadata should redact secret payment keys', () => {
    const paymentMeta = {
      card: '4111',
      cvc: '123',
      client_secret: 'pi_secret_xyz',
      brand: 'Visa'
    };
    const scrubbed = scrubPaymentMetadata(paymentMeta);
    expect(scrubbed.card).toBe('[REDACTED]');
    expect(scrubbed.cvc).toBe('[REDACTED]');
    expect(scrubbed.client_secret).toBe('[REDACTED]');
    expect(scrubbed.brand).toBe('Visa');
  });
});
