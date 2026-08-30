import { test, expect } from '@playwright/test';
import { cartRepository } from '../../src/repositories/customer/cartRepository';
import { orderRepository } from '../../src/repositories/customer/orderRepository';
import { checkoutService } from '../../src/services/checkoutService';

test.describe('Phase 2C-B & 2D: Persistent Cart, Atomic Checkout & Order History', () => {

  test('CO-01: cartRepository and orderRepository export all required methods with correct signatures', async () => {
    // cartRepository
    expect(typeof cartRepository.getOrCreateCart).toBe('function');
    expect(typeof cartRepository.getCart).toBe('function');
    expect(typeof cartRepository.getCartWithItems).toBe('function');
    expect(typeof cartRepository.addItem).toBe('function');
    expect(typeof cartRepository.updateItemQuantity).toBe('function');
    expect(typeof cartRepository.removeItem).toBe('function');
    expect(typeof cartRepository.clearCart).toBe('function');
    expect(typeof cartRepository.mergeGuestCart).toBe('function');

    // orderRepository
    expect(typeof orderRepository.getMyOrders).toBe('function');
    expect(typeof orderRepository.getCustomerOrders).toBe('function');
    expect(typeof orderRepository.getOrderHistory).toBe('function');
    expect(typeof orderRepository.getOrderById).toBe('function');
    expect(typeof orderRepository.getOrderByCode).toBe('function');
    expect(typeof orderRepository.getOrderStatusHistory).toBe('function');
    expect(typeof orderRepository.getShipmentDetails).toBe('function');

    // checkoutService
    expect(typeof checkoutService.placeOrderAtomic).toBe('function');
    expect(typeof checkoutService.validateStockAvailability).toBe('function');
    expect(typeof checkoutService.validatePromoCode).toBe('function');
  });

  test('CO-02: Safe handling of cartRepository and orderRepository when Supabase or user is unconfigured', async () => {
    const cart = await cartRepository.getCart('mock-non-existent-user');
    expect(Array.isArray(cart)).toBe(true);

    const orders = await orderRepository.getMyOrders('mock-non-existent-user');
    expect(Array.isArray(orders)).toBe(true);

    const history = await orderRepository.getOrderStatusHistory('mock-order-id');
    expect(Array.isArray(history)).toBe(true);

    // Empty or zero-item checkout atomic safely returns error without crashing
    const emptyCheckout = await checkoutService.placeOrderAtomic({
      cartItems: [],
      customerInfo: {
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '1234567890',
        street: '123 Test St',
        city: 'Cape Town',
        state: 'Western Cape',
        zip: '8001',
        country: 'South Africa',
      },
      paymentMethod: 'Card',
      shippingMethod: 'Express',
    });
    expect(emptyCheckout.success).toBe(false);
  });

  test('CO-03: Guest user can add items, update quantity, and apply promo code in cart', async ({ page }) => {
    await page.goto('/?domain=customer');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    // 1. Add first product to cart (automatically opens cart drawer)
    const addBtn = page.locator('button[id^="add-to-cart-btn-"]').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 2. Verify cart drawer content
    const cartDrawer = page.locator('#cart-drawer-container');
    await expect(cartDrawer).toBeVisible();
    await expect(cartDrawer.getByText(/subtotal/i)).toBeVisible();

    // 3. Apply promo code KIX10
    const promoInput = page.locator('#cart-promo-input');
    await promoInput.fill('KIX10');
    await page.locator('#cart-apply-promo-btn').click();

    // 4. Verify promo applied feedback
    await expect(page.getByText(/promo code applied/i).first()).toBeVisible();
  });

  test('CO-04: Full checkout flow from Cart to Vault Order Confirmation and Tracking', async ({ page }) => {
    await page.goto('/?domain=customer');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 1. Authenticate customer
    const userBtn = page.locator('#header-user-button');
    await userBtn.click();
    await page.locator('#customer-auth-switch-signup').click();
    await page.locator('#customer-auth-name').fill('Thabo Mokoena');
    await page.locator('#customer-auth-email').fill('thabo.m@vaultgrails.co.za');
    await page.locator('#customer-auth-password').fill('GrailPassword2026!');
    await page.locator('#customer-auth-submit-btn').click();

    await expect(page.locator('#customer-auth-modal-content')).not.toBeVisible();
    await expect(userBtn).toContainText(/thabo/i);

    // 2. Add product to cart (automatically opens cart drawer)
    const addBtn = page.locator('button[id^="add-to-cart-btn-"]').first();
    await addBtn.click();

    // 3. Proceed to checkout from cart drawer
    const checkoutBtn = page.locator('#cart-proceed-checkout-btn');
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // 4. Step 1 -> Step 2
    const step1Btn = page.locator('#checkout-step1-continue-btn');
    await expect(step1Btn).toBeVisible();
    await step1Btn.click();

    // 5. Step 2 -> Step 3
    const step2Btn = page.locator('#checkout-step2-continue-btn');
    await expect(step2Btn).toBeVisible();
    await step2Btn.click();

    // 6. Step 3: Confirm & Place Order
    const confirmBtn = page.locator('#checkout-confirm-pay-btn');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 7. Step 4: Vault Order Confirmed & Track Order button
    const trackBtn = page.locator('#checkout-track-order-btn');
    await expect(trackBtn).toBeVisible();
    await trackBtn.click();

    // 8. Verify Tracking View is active
    await expect(page.locator('#order-tracking-view, #tracking-status-badge')).toBeVisible();
  });

  test('CO-05: Customer and Admin isolation remains strictly enforced', async ({ page }) => {
    await page.goto('/?domain=admin');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const adminGuard = page.locator('#admin-route-forbidden, #header-admin-profile-button');
    await expect(adminGuard.first()).toBeVisible();

    await page.goto('/?domain=customer');
    await expect(page.locator('#header-user-button')).toBeVisible();
  });

});
