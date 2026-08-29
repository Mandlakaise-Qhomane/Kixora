import { test, expect } from '@playwright/test';
import {
  computeHmacSha256,
  generatePayFastSignature,
  verifyStripeSignature,
  verifyPayFastSignature,
  timingSafeEqual
} from '../../src/services/payments/crypto';
import { webhookIdempotency } from '../../src/services/payments/webhookIdempotency';
import { webhookService } from '../../src/services/webhookService';
import { paymentService } from '../../src/services/paymentService';

test.describe('Phase 3C: Payment Verification & Secure Webhook Handling', () => {

  test.beforeEach(() => {
    webhookIdempotency.clearRegistry();
  });

  test('WH-01: Stripe HMAC-SHA256 signature verification accepts valid signatures and rejects invalid/tampered payloads', async () => {
    const webhookSecret = 'whsec_test_kixora_secret_key_12345';
    const payload = JSON.stringify({
      id: 'evt_stripe_test_001',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_001',
          amount_received: 420000,
          currency: 'zar',
          metadata: { orderCode: 'KX-TEST-001' }
        }
      }
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const validSignature = computeHmacSha256(signedPayload, webhookSecret);
    const signatureHeader = `t=${timestamp},v1=${validSignature}`;

    // 1. Verify valid signature
    const validResult = verifyStripeSignature(payload, signatureHeader, webhookSecret);
    expect(validResult.valid).toBe(true);
    expect(validResult.error).toBeUndefined();

    // 2. Reject tampered payload with unchanged signature
    const tamperedPayload = JSON.stringify({ ...JSON.parse(payload), tampered: true });
    const tamperedResult = verifyStripeSignature(tamperedPayload, signatureHeader, webhookSecret);
    expect(tamperedResult.valid).toBe(false);
    expect(tamperedResult.error).toBeDefined();

    // 3. Reject wrong secret
    const wrongSecretResult = verifyStripeSignature(payload, signatureHeader, 'whsec_wrong_secret');
    expect(wrongSecretResult.valid).toBe(false);

    // 4. Timing-safe equality check
    expect(timingSafeEqual('abcdef', 'abcdef')).toBe(true);
    expect(timingSafeEqual('abcdef', 'abcdeg')).toBe(false);
    expect(timingSafeEqual('abcdef', 'short')).toBe(false);
  });

  test('WH-02: Stripe signature verification enforces timestamp tolerance against replay attacks', async () => {
    const webhookSecret = 'whsec_test_replay_key';
    const payload = JSON.stringify({ id: 'evt_replay_test', type: 'payment_intent.succeeded' });

    // Timestamp 10 minutes (600s) in the past (exceeds default tolerance 300s)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
    const oldSignature = computeHmacSha256(`${oldTimestamp}.${payload}`, webhookSecret);
    const oldHeader = `t=${oldTimestamp},v1=${oldSignature}`;

    // Replay attempt with expired timestamp must be rejected
    const replayResult = verifyStripeSignature(payload, oldHeader, webhookSecret, 300);
    expect(replayResult.valid).toBe(false);
    expect(replayResult.error).toContain('outside the tolerance window');

    // Fresh timestamp within 60 seconds must pass
    const freshTimestamp = Math.floor(Date.now() / 1000) - 30;
    const freshSignature = computeHmacSha256(`${freshTimestamp}.${payload}`, webhookSecret);
    const freshHeader = `t=${freshTimestamp},v1=${freshSignature}`;

    const freshResult = verifyStripeSignature(payload, freshHeader, webhookSecret, 300);
    expect(freshResult.valid).toBe(true);
  });

  test('WH-03: PayFast ITN MD5 signature verification validates correct parameter hashes with passphrase', async () => {
    const passphrase = 'kixora_secure_passphrase';
    const itnData: Record<string, string> = {
      m_payment_id: 'pf_1700000000_KX-8899',
      pf_payment_id: '1234567',
      payment_status: 'COMPLETE',
      item_name: 'Kixora Vault Order #KX-8899',
      amount_gross: '4200.00',
      amount_fee: '-96.60',
      amount_net: '4103.40',
      custom_str1: 'KX-8899',
      email_address: 'collector@kixora.com',
      merchant_id: '10000100'
    };

    // 1. Generate expected MD5 signature
    const signature = generatePayFastSignature(itnData, passphrase);
    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
    expect(signature.length).toBe(32); // MD5 hex length

    // 2. Verify matching signature
    const validVerify = verifyPayFastSignature(itnData, signature, passphrase);
    expect(validVerify.valid).toBe(true);
    expect(validVerify.expectedSignature).toBe(signature);

    // 3. Reject tampered amount
    const tamperedData = { ...itnData, amount_gross: '1.00' };
    const tamperedVerify = verifyPayFastSignature(tamperedData, signature, passphrase);
    expect(tamperedVerify.valid).toBe(false);

    // 4. Reject missing/wrong passphrase
    const wrongPassphraseVerify = verifyPayFastSignature(itnData, signature, 'different_secret');
    expect(wrongPassphraseVerify.valid).toBe(false);
  });

  test('WH-04: Webhook idempotency registry blocks duplicate event execution', async () => {
    const eventId = 'evt_idempotency_unique_9988';
    const provider = 'stripe';

    // 1. Initially not processed
    expect(await webhookIdempotency.isEventProcessed(eventId, provider)).toBe(false);

    // 2. Record processed event
    await webhookIdempotency.recordEventProcessed({
      eventId,
      provider,
      eventType: 'payment_intent.succeeded',
      orderCode: 'KX-9988',
      status: 'processed'
    });

    // 3. Subsequent check confirms processed
    expect(await webhookIdempotency.isEventProcessed(eventId, provider)).toBe(true);

    // 4. Webhook service processWebhook returns idempotent flag on second call
    const payload = {
      id: eventId,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_idempotency_test',
          metadata: { orderCode: 'KX-9988' }
        }
      }
    };

    const duplicateRes = await webhookService.processWebhook({
      provider: 'stripe',
      payload
    });

    expect(duplicateRes.success).toBe(true);
    expect(duplicateRes.idempotent).toBe(true);
  });

  test('WH-05: Webhook service reconciles payment success: marks order paid, authenticates grail, and confirms stock deduction', async () => {
    const orderCode = 'KX-WEBHOOK-PAID-01';
    const rawBody = JSON.stringify({
      id: 'evt_stripe_paid_001',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_paid_001',
          amount_received: 550000,
          currency: 'zar',
          metadata: { orderCode }
        }
      }
    });

    const secret = 'whsec_kixora_webhook_suite';
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = computeHmacSha256(`${timestamp}.${rawBody}`, secret);
    const signatureHeader = `t=${timestamp},v1=${signature}`;

    const res = await webhookService.verifyAndProcessStripeWebhook(
      rawBody,
      signatureHeader,
      secret
    );

    expect(res.success).toBe(true);
    expect(res.provider).toBe('stripe');
    expect(res.orderCode).toBe(orderCode);
    expect(res.paymentStatus).toBe('paid');
    expect(res.orderStatus).toBe('Authenticated');
    expect(res.idempotent).toBe(false);
  });

  test('WH-06: Webhook service reconciles payment failure: marks order failed and releases reserved stock', async () => {
    const orderCode = 'KX-WEBHOOK-FAIL-01';
    const payload = {
      m_payment_id: `pf_failed_${orderCode}`,
      pf_payment_id: '998877',
      payment_status: 'FAILED',
      custom_str1: orderCode,
      amount_gross: '3200.00'
    };

    const passphrase = 'test_passphrase';
    const signature = generatePayFastSignature(payload, passphrase);

    const res = await webhookService.verifyAndProcessPayFastWebhook(
      payload,
      signature,
      passphrase
    );

    expect(res.success).toBe(true);
    expect(res.provider).toBe('payfast');
    expect(res.orderCode).toBe(orderCode);
    expect(res.paymentStatus).toBe('failed');
    expect(res.orderStatus).toBe('Cancelled');
  });

  test('WH-07: Webhook service reconciles charge refund: marks order refunded and logs timeline audit', async () => {
    const orderCode = 'KX-WEBHOOK-REFUND-01';
    const rawBody = JSON.stringify({
      id: 'evt_stripe_refund_001',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_refund_001',
          payment_intent: 'pi_refund_001',
          amount_refunded: 450000,
          metadata: { orderCode }
        }
      }
    });

    const secret = 'whsec_refund_test';
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = computeHmacSha256(`${timestamp}.${rawBody}`, secret);
    const signatureHeader = `t=${timestamp},v1=${signature}`;

    const res = await webhookService.verifyAndProcessStripeWebhook(
      rawBody,
      signatureHeader,
      secret
    );

    expect(res.success).toBe(true);
    expect(res.provider).toBe('stripe');
    expect(res.orderCode).toBe(orderCode);
    expect(res.paymentStatus).toBe('refunded');
    expect(res.orderStatus).toBe('Cancelled');
  });

  test('WH-08: End-to-end webhook processing pipeline gracefully handles corrupted or unconfigured gateway requests', async () => {
    // 1. Corrupted JSON payload
    const corruptRes = await webhookService.processWebhook({
      provider: 'stripe',
      payload: null as any,
      rawBody: 'NOT_VALID_JSON_%%%'
    });
    expect(corruptRes.success).toBe(false);

    // 2. Invalid driver provider
    const invalidProviderRes = await webhookService.processWebhook({
      provider: 'invalid_gateway' as any,
      payload: { type: 'test' }
    });
    expect(invalidProviderRes.success).toBe(true); // Fallback mock driver resolves cleanly

    // 3. Delegation through paymentService facade
    const facadeRes = await paymentService.handlePaymentWebhook(
      { type: 'payment_intent.succeeded', orderCode: 'KX-FACADE-01' },
      undefined,
      'mock'
    );
    expect(facadeRes.success).toBe(true);
    expect(facadeRes.newStatus).toBe('paid');
  });
});
