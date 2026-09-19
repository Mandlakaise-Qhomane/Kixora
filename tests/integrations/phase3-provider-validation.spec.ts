import { test, expect } from '@playwright/test';
import { computeHmacSha256, generatePayFastSignature } from '../../src/services/payments/crypto';
import { webhookService } from '../../src/services/webhookService';

test.describe('Phase 3: Provider webhook validation', () => {
  test('rejects a verified Stripe payment event without an order reference', async () => {
    const rawBody = JSON.stringify({
      id: 'evt_missing_order',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_missing_order', amount_received: 1000, currency: 'zar' } },
    });
    const secret = 'whsec_phase3_test';
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = computeHmacSha256(`${timestamp}.${rawBody}`, secret);

    const result = await webhookService.processWebhook({
      provider: 'stripe',
      payload: JSON.parse(rawBody),
      rawBody,
      signatureHeader: `t=${timestamp},v1=${signature}`,
      secret,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('missing an order reference');
  });

  test('preserves PayFast amount metadata for reconciliation validation', async () => {
    const payload = {
      m_payment_id: 'pf_phase3_KX-VALIDATION',
      pf_payment_id: 'pf_123',
      payment_status: 'COMPLETE',
      custom_str1: 'KX-VALIDATION',
      amount_gross: '1250.00',
    };
    const passphrase = 'phase3-passphrase';
    const result = await webhookService.processWebhook({
      provider: 'payfast',
      payload,
      signature: generatePayFastSignature(payload, passphrase),
      passphrase,
    });

    expect(result.success).toBe(true);
    expect(result.orderCode).toBe('KX-VALIDATION');
  });
});
