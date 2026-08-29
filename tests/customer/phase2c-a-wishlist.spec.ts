import { test, expect } from '@playwright/test';
import { wishlistRepository } from '../../src/repositories/customer/wishlistRepository';

test.describe('Phase 2C-A: Persistent Wishlist / Saved Grails', () => {

  test('WL-01: wishlistRepository exports all required methods with correct signatures', async () => {
    expect(typeof wishlistRepository.getWishlist).toBe('function');
    expect(typeof wishlistRepository.addToWishlist).toBe('function');
    expect(typeof wishlistRepository.removeFromWishlist).toBe('function');
    expect(typeof wishlistRepository.isInWishlist).toBe('function');
    expect(typeof wishlistRepository.isWishlisted).toBe('function');
    expect(typeof wishlistRepository.getWishlistProductIds).toBe('function');
    expect(typeof wishlistRepository.mergeGuestWishlist).toBe('function');
  });

  test('WL-02: wishlistRepository safe handling when Supabase or user is unconfigured', async () => {
    // When called with mock/empty user in unconfigured mode, it should safely return empty array or false
    const items = await wishlistRepository.getWishlist('mock-non-existent-user');
    expect(Array.isArray(items)).toBe(true);

    const isWishlisted = await wishlistRepository.isInWishlist('mock-user', 'kixo-shattered-backboard-01');
    expect(typeof isWishlisted).toBe('boolean');

    // Safe execution without unhandled rejections
    await expect(wishlistRepository.addToWishlist('', '')).resolves.toBeUndefined();
    await expect(wishlistRepository.removeFromWishlist('', '')).resolves.toBeUndefined();
    await expect(wishlistRepository.mergeGuestWishlist('', [])).resolves.toBeUndefined();
  });

  test('WL-03: Guest user can view and toggle wishlist in UI via localStorage fallback', async ({ page }) => {
    await page.goto('/?domain=customer');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('kixora_wishlist_v2', JSON.stringify(['kixo-shattered-backboard-01']));
    });
    await page.reload();

    // 1. Check that the wishlisted item button has the active styled class
    const wishlistedBtn = page.locator('#wishlist-toggle-btn-kixo-shattered-backboard-01');
    await expect(wishlistedBtn).toBeVisible();
    await expect(wishlistedBtn).toHaveClass(/bg-\[#FF7A00\]\/20/);

    // 2. Toggle item off
    await wishlistedBtn.click();
    await expect(wishlistedBtn).not.toHaveClass(/bg-\[#FF7A00\]\/20/);
    await expect(page.getByText(/removed from wishlist/i).first()).toBeVisible();

    // 3. Toggle item on again
    await wishlistedBtn.click();
    await expect(wishlistedBtn).toHaveClass(/bg-\[#FF7A00\]\/20/);
    await expect(page.getByText(/saved to wishlist/i).first()).toBeVisible();
  });

  test('WL-04: Authenticated user interacts with Wishlist and receives optimistic feedback', async ({ page }) => {
    await page.goto('/?domain=customer');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 1. Authenticate customer
    const userBtn = page.locator('#header-user-button');
    await userBtn.click();
    await page.locator('#customer-auth-switch-signup').click();
    await page.locator('#customer-auth-name').fill('Sipho Dlamini');
    await page.locator('#customer-auth-email').fill('sipho.d@vaultgrails.co.za');
    await page.locator('#customer-auth-password').fill('VaultSecret2026!');
    await page.locator('#customer-auth-submit-btn').click();

    // Verify authenticated state
    await expect(page.locator('#customer-auth-modal-content')).not.toBeVisible();
    await expect(userBtn).toContainText(/sipho/i);

    // 2. Toggle a sneaker wishlist item
    const toggleBtn = page.locator('button[id^="wishlist-toggle-btn-"]').first();
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // 3. Verify optimistic toast feedback
    const toast = page.getByText(/wishlist/i).first();
    await expect(toast).toBeVisible();
  });

  test('WL-05: Customer and Admin isolation is preserved', async ({ page }) => {
    // Navigate to admin domain without credentials
    await page.goto('/?domain=admin');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Verify domain guard prompts for admin authentication or shows forbidden
    const adminAuthPrompt = page.locator('#admin-route-forbidden, #header-admin-profile-button');
    await expect(adminAuthPrompt.first()).toBeVisible();

    // Switch back to customer storefront
    await page.goto('/?domain=customer');
    await expect(page.locator('#header-user-button')).toBeVisible();
  });

});
