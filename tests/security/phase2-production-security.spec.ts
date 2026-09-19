import { test, expect } from '@playwright/test';
import { validateProductionEnv } from '../../src/config/env';
import { StripePaymentDriver } from '../../src/services/payments/stripeDriver';
import { PayFastPaymentDriver } from '../../src/services/payments/payfastDriver';
import { trackingWebhookService } from '../../src/services/shipping/trackingWebhookService';

const envKeys = [
  'NODE_ENV',
  'VITE_PAYMENT_PROVIDER_MODE',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_PAYMENT_PUBLIC_KEY',
  'VITE_PAYFAST_MERCHANT_ID',
  'VITE_PAYFAST_MERCHANT_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PAYFAST_PASSPHRASE',
  'SHIPPING_WEBHOOK_SECRET',
  'CORS_ALLOWED_ORIGINS',
] as const;

test.describe('Phase 2: Production Security Gates', () => {
  const originalEnv = new Map<string, string | undefined>();

  test.beforeEach(() => {
    for (const key of envKeys) {
      originalEnv.set(key, process.env[key]);
      delete process.env[key];
    }
    process.env.NODE_ENV = 'production';
  });

  test.afterEach(() => {
    for (const key of envKeys) {
      const value = originalEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  test('rejects mock payment mode and missing production secrets', () => {
    const result = validateProductionEnv();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('VITE_PAYMENT_PROVIDER_MODE must be stripe or payfast in production.');
    expect(result.errors).toContain('SHIPPING_WEBHOOK_SECRET is required.');
  });

  test('accepts a complete Stripe production configuration', () => {
    Object.assign(process.env, {
      VITE_PAYMENT_PROVIDER_MODE: 'stripe',
      VITE_STRIPE_PUBLISHABLE_KEY: 'pk_live_test',
      STRIPE_SECRET_KEY: 'sk_live_test',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      SHIPPING_WEBHOOK_SECRET: 'shipping_test',
      CORS_ALLOWED_ORIGINS: 'https://kixora.com,https://admin.kixora.com',
    });

    expect(validateProductionEnv()).toEqual({ valid: true, errors: [] });
  });

  test('rejects unsigned Stripe, PayFast, and tracking webhooks', async () => {
    const stripe = await new StripePaymentDriver().handleWebhook({
      rawBody: JSON.stringify({ type: 'payment_intent.succeeded' }),
    });
    expect(stripe.success).toBe(false);

    const payfast = await new PayFastPaymentDriver().handleWebhook({
      payload: { payment_status: 'COMPLETE', custom_str1: 'KX-TEST' },
    });
    expect(payfast.success).toBe(false);

    const tracking = await trackingWebhookService.verifyAndProcessTrackingWebhook({
      rawBody: JSON.stringify({ eventId: 'evt-unsigned', status: 'DELIVERED' }),
      secret: '',
    });
    expect(tracking.success).toBe(false);
  });
});
