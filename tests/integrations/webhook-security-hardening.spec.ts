import { test, expect } from '@playwright/test';
import { computeHmacSha256, verifyPayFastSignature } from '../../src/services/payments/crypto';
import { trackingWebhookService } from '../../src/services/shipping/trackingWebhookService';
import { StripePaymentDriver } from '../../src/services/payments/stripeDriver';
import { PayFastPaymentDriver } from '../../src/services/payments/payfastDriver';
import { webhookIdempotency } from '../../src/services/payments/webhookIdempotency';

test.describe('Phase 10: Webhook Security Hardening & Replay Attack Protection', () => {

  test.beforeEach(() => {
    webhookIdempotency.clearRegistry();
  });

  // 1. CARRIER / TRACKING WEBHOOK SECURITY
  test('SEC-01: Carrier Webhook - Validates authentic HMAC-SHA256 signature with timestamp', async () => {
    const secret = 'whsec_shipping_secret_test_123';
    const nowSec = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      eventId: 'evt_carrier_sec_01',
      carrier: 'The Courier Guy',
      trackingNumber: 'TCG12345678ZA',
      status: 'IN_TRANSIT_HUB',
      location: 'Johannesburg North Hub',
    });

    const signature = computeHmacSha256(`${nowSec}.${body}`, secret);
    const header = `t=${nowSec},v1=${signature}`;

    const res = await trackingWebhookService.verifyAndProcessTrackingWebhook({
      rawBody: body,
      signatureHeader: header,
      secret,
    });

    expect(res.success).toBe(true);
    expect(res.idempotent).toBe(false);
    expect(res.mappedStatus).toBe('Shipped');
  });

  test('SEC-02: Carrier Webhook - Rejects tampered raw payload even if signature header matches original', async () => {
    const secret = 'whsec_shipping_secret_test_123';
    const nowSec = Math.floor(Date.now() / 1000);
    const originalBody = JSON.stringify({
      eventId: 'evt_carrier_sec_02',
      carrier: 'The Courier Guy',
      trackingNumber: 'TCG12345678ZA',
      status: 'IN_TRANSIT_HUB',
    });

    const signature = computeHmacSha256(`${nowSec}.${originalBody}`, secret);
    const header = `t=${nowSec},v1=${signature}`;

    const tamperedBody = JSON.stringify({
      eventId: 'evt_carrier_sec_02',
      carrier: 'The Courier Guy',
      trackingNumber: 'TCG12345678ZA',
      status: 'DELIVERED_POD', // attacker altered status
    });

    const res = await trackingWebhookService.verifyAndProcessTrackingWebhook({
      rawBody: tamperedBody,
      signatureHeader: header,
      secret,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Calculated webhook signature does not match received signature');
  });

  test('SEC-03: Carrier Webhook - Rejects expired timestamp beyond 300s tolerance (Replay Attack Prevention)', async () => {
    const secret = 'whsec_shipping_secret_test_123';
    const oldSec = Math.floor(Date.now() / 1000) - 400; // 400 seconds in the past (> 300s limit)
    const body = JSON.stringify({
      eventId: 'evt_carrier_sec_03',
      carrier: 'The Courier Guy',
      trackingNumber: 'TCG12345678ZA',
      status: 'DELIVERED',
    });

    const signature = computeHmacSha256(`${oldSec}.${body}`, secret);
    const header = `t=${oldSec},v1=${signature}`;

    const res = await trackingWebhookService.verifyAndProcessTrackingWebhook({
      rawBody: body,
      signatureHeader: header,
      secret,
      toleranceSeconds: 300,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('outside the tolerance window');
  });

  test('SEC-04: Carrier Webhook - Rejects missing signature when secret is configured', async () => {
    const secret = 'whsec_shipping_secret_test_123';
    const body = JSON.stringify({
      eventId: 'evt_carrier_sec_04',
      carrier: 'The Courier Guy',
      trackingNumber: 'TCG12345678ZA',
      status: 'IN_TRANSIT',
    });

    const res = await trackingWebhookService.verifyAndProcessTrackingWebhook({
      rawBody: body,
      secret,
      // signatureHeader omitted
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Missing carrier signature header');
  });

  // 2. STRIPE WEBHOOK SECURITY
  test('SEC-05: Stripe Webhook - Driver rejects missing or invalid HMAC signature when secret configured', async () => {
    const stripeDriver = new StripePaymentDriver();
    const rawBody = JSON.stringify({
      id: 'evt_stripe_sec_01',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test_123', status: 'succeeded' } },
    });

    // Case A: Missing signature header
    const missingRes = await stripeDriver.handleWebhook({
      provider: 'stripe',
      rawBody,
      secret: 'whsec_stripe_test_secret',
    });
    expect(missingRes.success).toBe(false);
    expect(missingRes.error).toContain('Missing mandatory Stripe signature header');

    // Case B: Invalid signature header
    const invalidRes = await stripeDriver.handleWebhook({
      provider: 'stripe',
      rawBody,
      signatureHeader: 't=1614555555,v1=invalidsignaturehash999',
      secret: 'whsec_stripe_test_secret',
    });
    expect(invalidRes.success).toBe(false);
  });

  test('SEC-06: Stripe Webhook - Accepts valid HMAC-SHA256 signature and rejects replayed requests', async () => {
    const stripeDriver = new StripePaymentDriver();
    const secret = 'whsec_stripe_test_secret';
    const nowSec = Math.floor(Date.now() / 1000);
    const rawBody = JSON.stringify({
      id: 'evt_stripe_sec_02',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_valid_123',
          amount: 550000,
          currency: 'zar',
          status: 'succeeded',
          metadata: { orderCode: 'KX-TEST-002' },
        },
      },
    });

    const signature = computeHmacSha256(`${nowSec}.${rawBody}`, secret);
    const signatureHeader = `t=${nowSec},v1=${signature}`;

    const validRes = await stripeDriver.handleWebhook({
      provider: 'stripe',
      rawBody,
      signatureHeader,
      secret,
    });
    expect(validRes.success).toBe(true);
    expect(validRes.verified).toBe(true);
    expect(validRes.orderCode).toBe('KX-TEST-002');

    // Replay with expired timestamp (> 300s)
    const oldSec = nowSec - 500;
    const oldSig = computeHmacSha256(`${oldSec}.${rawBody}`, secret);
    const replayedHeader = `t=${oldSec},v1=${oldSig}`;

    const replayedRes = await stripeDriver.handleWebhook({
      provider: 'stripe',
      rawBody,
      signatureHeader: replayedHeader,
      secret,
    });
    expect(replayedRes.success).toBe(false);
    expect(replayedRes.error).toContain('outside the tolerance window');
  });

  // 3. PAYFAST WEBHOOK SECURITY
  test('SEC-07: PayFast Webhook - Enforces MD5 signature verification and rejects invalid signature', async () => {
    const payfastDriver = new PayFastPaymentDriver();
    const passphrase = 'kixora_vault_passphrase_test';

    const itnData = {
      m_payment_id: 'KX_PAYFAST_9988',
      pf_payment_id: 'PF_12345678',
      payment_status: 'COMPLETE',
      item_name: 'Nike Dunk Low Reverse Panda - 10 US',
      amount_gross: '4200.00',
      amount_fee: '-96.60',
      amount_net: '4103.40',
      custom_str1: 'KX-ORD-9988',
    };

    // Calculate valid MD5 signature
    const validSig = verifyPayFastSignature(itnData, 'dummy', passphrase).expectedSignature!;

    // Case A: Valid signature with configured passphrase
    const validRes = await payfastDriver.handleWebhook({
      provider: 'payfast',
      payload: itnData,
      signature: validSig,
      passphrase,
    });
    expect(validRes.success).toBe(true);
    expect(validRes.verified).toBe(true);
    expect(validRes.orderCode).toBe('KX-ORD-9988');

    // Case B: Tampered amount / Invalid signature
    const invalidRes = await payfastDriver.handleWebhook({
      provider: 'payfast',
      payload: { ...itnData, amount_gross: '100.00' }, // altered
      signature: validSig,
      passphrase,
    });
    expect(invalidRes.success).toBe(false);
    expect(invalidRes.error).toMatch(/signature/i);
  });

});
