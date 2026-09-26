import { afterEach, describe, expect, it } from 'vitest';
import { validateProductionEnv } from '../../src/config/env';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('validateProductionEnv', () => {
  it('accepts the PayFast production contract when all required origins are present', () => {
    process.env.NODE_ENV = 'production';
    process.env.VITE_PAYMENT_PROVIDER_MODE = 'payfast';
    process.env.VITE_PAYFAST_MERCHANT_ID = '100001';
    process.env.VITE_PAYFAST_MERCHANT_KEY = 'merchant-key';
    process.env.PAYFAST_PASSPHRASE = 'strong-passphrase';
    process.env.ADMIN_ORIGIN = 'https://admin.kixora.com';
    process.env.CUSTOMER_ORIGIN = 'https://kixora.com';
    process.env.CORS_ALLOWED_ORIGINS = 'https://admin.kixora.com,https://kixora.com';

    expect(validateProductionEnv().valid).toBe(true);
  });

  it('rejects empty or wildcard CORS configuration in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.VITE_PAYMENT_PROVIDER_MODE = 'payfast';
    process.env.VITE_PAYFAST_MERCHANT_ID = '100001';
    process.env.VITE_PAYFAST_MERCHANT_KEY = 'merchant-key';
    process.env.PAYFAST_PASSPHRASE = 'strong-passphrase';
    process.env.ADMIN_ORIGIN = 'https://admin.kixora.com';
    process.env.CUSTOMER_ORIGIN = 'https://kixora.com';
    process.env.CORS_ALLOWED_ORIGINS = '*';

    const result = validateProductionEnv();

    expect(result.valid).toBe(false);
    expect(result.errors.some((item) => item.includes('CORS_ALLOWED_ORIGINS'))).toBe(true);
  });
});
