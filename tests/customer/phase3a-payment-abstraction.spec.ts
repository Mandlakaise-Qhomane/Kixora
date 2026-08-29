import { test, expect } from '@playwright/test';
import { paymentService } from '../../src/services/paymentService';
import { checkoutService } from '../../src/services/checkoutService';

test.describe('Phase 3A: Production Commerce Foundation & Payment Abstraction', () => {
  
  test('PA-01: paymentService initializes payment intent successfully with valid input', async () => {
    const intent = await paymentService.initializePayment({
      amount: 3499,
      currency: 'ZAR',
      orderCode: 'KXO-9999',
      customerEmail: 'test@kixora.com',
    });

    expect(intent.success).toBe(true);
    expect(intent.paymentIntentId).toBeDefined();
    expect(intent.status).toBe('pending');
    expect(intent.provider).toBe('mock');
  });

  test('PA-02: paymentService rejects invalid payment amount', async () => {
    const intent = await paymentService.initializePayment({
      amount: 0,
      currency: 'ZAR',
      orderCode: 'KXO-0000',
      customerEmail: 'test@kixora.com',
    });

    expect(intent.success).toBe(false);
    expect(intent.status).toBe('failed');
    expect(intent.error).toContain('Invalid payment amount');
  });

  test('PA-03: paymentService webhook handles payment success correctly', async () => {
    const webhookResult = await paymentService.handlePaymentWebhook({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          metadata: {
            orderCode: 'KXO-1234'
          }
        }
      }
    });

    expect(webhookResult.success).toBe(true);
    expect(webhookResult.newStatus).toBe('paid');
    expect(webhookResult.orderCode).toBe('KXO-1234');
  });

  test('PA-04: paymentService webhook handles payment failure correctly', async () => {
    const webhookResult = await paymentService.handlePaymentWebhook({
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          metadata: {
            orderCode: 'KXO-5678'
          }
        }
      }
    });

    expect(webhookResult.success).toBe(true);
    expect(webhookResult.newStatus).toBe('failed');
    expect(webhookResult.orderCode).toBe('KXO-5678');
  });

  test('PA-05: checkoutService validates customer email before order placement', async () => {
    const result = await checkoutService.placeOrderAtomic({
      customerInfo: { email: '' },
      cartItems: []
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('VALIDATION_ERROR');
    expect(result.error).toContain('Customer email is required');
  });

  test('PA-06: checkoutService validates non-empty cart before order placement', async () => {
    const result = await checkoutService.placeOrderAtomic({
      customerInfo: { email: 'buyer@kixora.com' },
      cartItems: []
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('EMPTY_CART');
  });

  test('PA-07: Admin domain isolation boundary check', async ({ page }) => {
    await page.goto('/');
    // Customer storefront should not display admin management panels by default
    await expect(page.locator('#admin-dashboard-container')).not.toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

});
