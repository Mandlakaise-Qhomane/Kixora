import { afterEach, describe, expect, it } from 'vitest';
import { validateProductionEnv } from '../../src/config/env';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

const payfastBase = () => ({
  NODE_ENV: 'production',
  VITE_PAYMENT_PROVIDER_MODE: 'payfast',
  VITE_PAYFAST_MERCHANT_ID: '100001',
  VITE_PAYFAST_MERCHANT_KEY: 'merchant-key',
  PAYFAST_PASSPHRASE: 'strong-passphrase',
  ADMIN_ORIGIN: 'https://admin.kixora.com',
  CUSTOMER_ORIGIN: 'https://kixora.com',
  CORS_ALLOWED_ORIGINS: 'https://admin.kixora.com,https://kixora.com',
});

const applyEnv = (patch: Record<string, string | undefined>) => {
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
};

describe('validateProductionEnv', () => {
  it('accepts the PayFast production contract when all required origins are present', () => {
    applyEnv(payfastBase());
    expect(validateProductionEnv().valid).toBe(true);
  });

  it('rejects empty or wildcard CORS configuration in production', () => {
    applyEnv({ ...payfastBase(), CORS_ALLOWED_ORIGINS: '*' });
    const result = validateProductionEnv();
    expect(result.valid).toBe(false);
    expect(result.errors.some((item) => item.includes('CORS_ALLOWED_ORIGINS'))).toBe(true);
  });

  it('skips strict validation when NODE_ENV is not production', () => {
    applyEnv({ ...payfastBase(), NODE_ENV: 'development' });
    const result = validateProductionEnv();
    expect(result.valid).toBe(true);
  });

  it('rejects when ADMIN_ORIGIN and CUSTOMER_ORIGIN are not distinct in production', () => {
    applyEnv({
      ...payfastBase(),
      ADMIN_ORIGIN: 'https://kixora.com',
      CUSTOMER_ORIGIN: 'https://kixora.com',
    });
    const result = validateProductionEnv();
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('distinct') || e.includes('ADMIN_ORIGIN') || e.includes('CUSTOMER_ORIGIN'))
    ).toBe(true);
  });

  it('rejects when an origin declared in CUSTOMER_ORIGIN is missing from CORS_ALLOWED_ORIGINS', () => {
    applyEnv({
      ...payfastBase(),
      CORS_ALLOWED_ORIGINS: 'https://admin.kixora.com',
    });
    const result = validateProductionEnv();
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('CORS_ALLOWED_ORIGINS') || e.includes('CUSTOMER_ORIGIN'))
    ).toBe(true);
  });

  it('rejects PayFast configuration when PAYFAST_PASSPHRASE is missing', () => {
    applyEnv({ ...payfastBase(), PAYFAST_PASSPHRASE: undefined });
    const result = validateProductionEnv();
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('PAYFAST') || e.includes('PASSPHRASE') || e.includes('passphrase'))
    ).toBe(true);
  });

  it('accepts Stripe configuration with STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET present', () => {
    applyEnv({
      NODE_ENV: 'production',
      VITE_PAYMENT_PROVIDER_MODE: 'stripe',
      VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_examplepublishablekey',
      STRIPE_SECRET_KEY: 'sk_test_examplesecret',
      STRIPE_WEBHOOK_SECRET: 'whsec_examplewebhook',
      ADMIN_ORIGIN: 'https://admin.kixora.com',
      CUSTOMER_ORIGIN: 'https://kixora.com',
      CORS_ALLOWED_ORIGINS: 'https://admin.kixora.com,https://kixora.com',
    });
    const result = validateProductionEnv();
    expect(result.valid).toBe(true);
  });

  it('rejects Stripe configuration when STRIPE_SECRET_KEY is missing in production', () => {
    applyEnv({
      NODE_ENV: 'production',
      VITE_PAYMENT_PROVIDER_MODE: 'stripe',
      STRIPE_SECRET_KEY: undefined,
      STRIPE_WEBHOOK_SECRET: 'whsec_example',
      ADMIN_ORIGIN: 'https://admin.kixora.com',
      CUSTOMER_ORIGIN: 'https://kixora.com',
      CORS_ALLOWED_ORIGINS: 'https://admin.kixora.com,https://kixora.com',
    });
    const result = validateProductionEnv();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('STRIPE_SECRET_KEY'))).toBe(true);
  });
});

