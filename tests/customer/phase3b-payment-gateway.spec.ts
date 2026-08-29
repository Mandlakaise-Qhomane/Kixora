import { test, expect } from '@playwright/test';
import { getPaymentDriver, getActivePaymentDriver, isPaymentGatewayConfigured } from '../../src/services/payments';
import { MockPaymentDriver } from '../../src/services/payments/mockDriver';
import { StripePaymentDriver } from '../../src/services/payments/stripeDriver';
import { PayFastPaymentDriver } from '../../src/services/payments/payfastDriver';
import { paymentService } from '../../src/services/paymentService';

test.describe('Phase 3B: Real Payment Gateway Integration & Drivers', () => {

  test('PG-01: Gateway driver factory resolves correct driver instance for mock, stripe, and payfast', async () => {
    const mockDriver = getPaymentDriver('mock');
    expect(mockDriver).toBeInstanceOf(MockPaymentDriver);
    expect(mockDriver.provider).toBe('mock');
    expect(mockDriver.isConfigured()).toBe(true);

    const stripeDriver = getPaymentDriver('stripe');
    expect(stripeDriver).toBeInstanceOf(StripePaymentDriver);
    expect(stripeDriver.provider).toBe('stripe');

    const payfastDriver = getPaymentDriver('payfast');
    expect(payfastDriver).toBeInstanceOf(PayFastPaymentDriver);
    expect(payfastDriver.provider).toBe('payfast');

    const activeDriver = getActivePaymentDriver();
    expect(activeDriver).toBeDefined();
    expect(['mock', 'stripe', 'payfast', 'paypal']).toContain(activeDriver.provider);
  });

  test('PG-02: Stripe driver creates payment intent with minor units and client secret format', async () => {
    const stripeDriver = new StripePaymentDriver();

    const intent = await stripeDriver.createPaymentIntent({
      amount: 4500,
      currency: 'ZAR',
      orderCode: 'KXO-7892',
      customerEmail: 'collector@kixora.com',
      metadata: { release: 'Travis Scott Fragment' }
    });

    expect(intent.success).toBe(true);
    expect(intent.provider).toBe('stripe');
    expect(intent.paymentIntentId).toMatch(/^pi_stripe_/);
    expect(intent.clientSecret).toMatch(/^pi_stripe_.*_secret_/);
    expect(intent.status).toBe('pending');
    expect(intent.gatewayData?.amountInCents).toBe(450000);
    expect(intent.gatewayData?.currency).toBe('zar');
  });

  test('PG-03: PayFast driver creates valid redirect payload and ZAR parameters for South African checkout', async () => {
    const payfastDriver = new PayFastPaymentDriver();

    const intent = await payfastDriver.createPaymentIntent({
      amount: 3200,
      currency: 'ZAR',
      orderCode: 'KXO-4412',
      customerEmail: 'kagiso.m@kixora.co.za',
      customerName: 'Kagiso Molefe',
    });

    expect(intent.success).toBe(true);
    expect(intent.provider).toBe('payfast');
    expect(intent.paymentIntentId).toContain('KXO-4412');
    expect(intent.redirectUrl).toBeDefined();
    expect(intent.redirectUrl).toContain('payfast.co.za/eng/process');
    expect(intent.gatewayData?.merchant_id).toBeDefined();
    expect(intent.gatewayData?.amount).toBe('3200.00');
    expect(intent.gatewayData?.email_address).toBe('kagiso.m@kixora.co.za');
  });

  test('PG-04: PayFast webhook / ITN parser transitions payment statuses correctly', async () => {
    const payfastDriver = new PayFastPaymentDriver();

    // 1. COMPLETE event
    const completeRes = await payfastDriver.handleWebhook({
      provider: 'payfast',
      payload: {
        payment_status: 'COMPLETE',
        m_payment_id: 'pf_1700000000_KXO-5555',
        pf_payment_id: '12345678',
        amount_gross: '2500.00',
      }
    });

    expect(completeRes.success).toBe(true);
    expect(completeRes.newStatus).toBe('paid');
    expect(completeRes.orderCode).toBe('KXO-5555');

    // 2. FAILED event
    const failedRes = await payfastDriver.handleWebhook({
      provider: 'payfast',
      payload: {
        payment_status: 'FAILED',
        m_payment_id: 'pf_1700000000_KXO-5555',
        pf_payment_id: '12345678',
      }
    });

    expect(failedRes.success).toBe(true);
    expect(failedRes.newStatus).toBe('failed');

    // 3. CANCELLED event
    const cancelledRes = await payfastDriver.handleWebhook({
      provider: 'payfast',
      payload: {
        payment_status: 'CANCELLED',
        m_payment_id: 'pf_1700000000_KXO-5555',
      }
    });

    expect(cancelledRes.success).toBe(true);
    expect(cancelledRes.newStatus).toBe('cancelled');
  });

  test('PG-05: Stripe webhook parser handles succeeded, failed, processing, and refund events', async () => {
    const stripeDriver = new StripePaymentDriver();

    // 1. payment_intent.succeeded
    const succRes = await stripeDriver.handleWebhook({
      provider: 'stripe',
      payload: {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_stripe_test123',
            metadata: { orderCode: 'KXO-9999' }
          }
        }
      }
    });

    expect(succRes.success).toBe(true);
    expect(succRes.newStatus).toBe('paid');
    expect(succRes.orderCode).toBe('KXO-9999');

    // 2. payment_intent.payment_failed
    const failRes = await stripeDriver.handleWebhook({
      provider: 'stripe',
      payload: {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_stripe_test123',
            metadata: { orderCode: 'KXO-9999' }
          }
        }
      }
    });

    expect(failRes.success).toBe(true);
    expect(failRes.newStatus).toBe('failed');

    // 3. charge.refunded
    const refundRes = await stripeDriver.handleWebhook({
      provider: 'stripe',
      payload: {
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_stripe_test123',
            metadata: { orderCode: 'KXO-9999' }
          }
        }
      }
    });

    expect(refundRes.success).toBe(true);
    expect(refundRes.newStatus).toBe('refunded');
  });

  test('PG-06: paymentService delegates to active driver and processes refunds', async () => {
    const result = await paymentService.initializePayment({
      amount: 5000,
      currency: 'ZAR',
      orderCode: 'KXO-1234',
      customerEmail: 'test@kixora.com'
    });

    expect(result.success).toBe(true);
    expect(result.paymentIntentId).toBeDefined();

    // Refund handling
    const refund = await paymentService.refundPayment('order-uuid-test', 5000);
    expect(refund.success).toBe(true);
    expect(refund.status).toBe('refunded');
  });

  test('PG-07: Client checkout flow executes cleanly with payment gateway integration', async ({ page }) => {
    await page.goto('/?domain=customer');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 1. Add product to cart (automatically opens cart drawer)
    const addBtn = page.locator('button[id^="add-to-cart-btn-"]').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 2. Click proceed to checkout in drawer
    const checkoutBtn = page.locator('#cart-proceed-checkout-btn');
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // 3. Checkout modal is visible
    const modalBackdrop = page.locator('#checkout-modal-backdrop');
    await expect(modalBackdrop).toBeVisible();

    // 4. Fill Step 1 Shipping
    await page.locator('#checkout-fullname').fill('Mandla Dlamini');
    await page.locator('#checkout-email').fill('mandla@dlamini.co.za');
    await page.locator('#checkout-phone').fill('+27 83 123 4567');
    await page.locator('#checkout-street').fill('88 Bree Street');
    await page.locator('#checkout-city').fill('Cape Town');
    await page.locator('#checkout-zip').fill('8001');

    // 5. Continue to Step 2
    const step1Btn = page.locator('#checkout-step1-continue-btn');
    await step1Btn.click();

    // 6. Step 2: Payment options
    await expect(page.getByText('2. SECURE PAYMENT METHOD')).toBeVisible();

    // 7. Continue to Step 3
    const step2Btn = page.locator('#checkout-step2-continue-btn');
    await step2Btn.click();

    // 8. Step 3: Review & Place Order
    await expect(page.getByText('3. REVIEW & AUTHORIZATION')).toBeVisible();
    const confirmBtn = page.locator('#checkout-confirm-pay-btn');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 9. Step 4: Confirmation screen
    await expect(page.locator('#checkout-track-order-btn')).toBeVisible({ timeout: 10000 });
  });

});
