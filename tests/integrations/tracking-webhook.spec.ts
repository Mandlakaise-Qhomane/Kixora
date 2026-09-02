import { test, expect } from '@playwright/test';
import { trackingWebhookService } from '../../src/services/shipping/trackingWebhookService';
import { webhookIdempotency } from '../../src/services/payments/webhookIdempotency';

test.describe('Phase 9: Automated Tracking Webhooks & Status Mapping', () => {

  test.beforeEach(() => {
    webhookIdempotency.clearRegistry();
  });

  test('TRACK-01: Correctly maps diverse external carrier statuses to internal order states', () => {
    // Delivered
    const delivered = trackingWebhookService.mapCarrierStatus('DELIVERED_POD');
    expect(delivered.internalOrderStatus).toBe('Delivered');

    // In Transit
    const inTransit = trackingWebhookService.mapCarrierStatus('IN_TRANSIT_HUB');
    expect(inTransit.internalOrderStatus).toBe('Shipped');

    // Out for delivery
    const outForDelivery = trackingWebhookService.mapCarrierStatus('OUT_FOR_DELIVERY');
    expect(outForDelivery.internalOrderStatus).toBe('Shipped');
    expect(outForDelivery.milestoneTitle).toBe('Out for Delivery');

    // Collected
    const collected = trackingWebhookService.mapCarrierStatus('COLLECTED_AT_ORIGIN');
    expect(collected.internalOrderStatus).toBe('Shipped');

    // Exception
    const delayed = trackingWebhookService.mapCarrierStatus('WEATHER_DELAY_EXCEPTION');
    expect(delayed.internalOrderStatus).toBe('Processing');
  });

  test('TRACK-02: Tracking webhook enforces idempotency against duplicate delivery events', async () => {
    const payload = {
      eventId: 'evt_track_001',
      carrier: 'The Courier Guy',
      trackingNumber: 'TCG88990011ZA',
      orderCode: 'KXO-5544',
      status: 'DELIVERED_POD',
      location: 'Sandton Hub',
      timestamp: new Date().toISOString(),
      description: 'Delivered and signed for by S. Zulu',
    };

    // First delivery attempt
    const res1 = await trackingWebhookService.processTrackingWebhook(payload);
    expect(res1.success).toBe(true);
    expect(res1.idempotent).toBe(false);
    expect(res1.mappedStatus).toBe('Delivered');

    // Duplicate delivery attempt (e.g. carrier retry or duplicate webhook)
    const res2 = await trackingWebhookService.processTrackingWebhook(payload);
    expect(res2.success).toBe(true);
    expect(res2.idempotent).toBe(true);
  });

  test('TRACK-03: Multiple concurrent tracking webhooks are processed with exactly one active execution', async () => {
    const payload = {
      eventId: 'evt_track_concurrent_999',
      carrier: 'Vault Priority Express',
      trackingNumber: 'KX-99887766-ZA',
      orderCode: 'KXO-1122',
      status: 'OUT_FOR_DELIVERY',
      location: 'Rosebank Courier Unit',
      timestamp: new Date().toISOString(),
      description: 'Courier en route to recipient',
    };

    const results = await Promise.all([
      trackingWebhookService.processTrackingWebhook(payload),
      trackingWebhookService.processTrackingWebhook(payload),
      trackingWebhookService.processTrackingWebhook(payload),
    ]);

    const primaryCount = results.filter(r => r.idempotent === false).length;
    const duplicateCount = results.filter(r => r.idempotent === true).length;

    expect(primaryCount).toBe(1);
    expect(duplicateCount).toBe(2);
  });

});
