import { test, expect } from '@playwright/test';

test.describe('Phase 2B: Customer Authentication UI Integration', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to customer domain and clear storage
    await page.goto('/?domain=customer');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('CUST-AUTH-01: Customer can open auth modal from header and switch between Sign In and Sign Up', async ({ page }) => {
    // 1. Verify unauthenticated header user button is visible
    const userBtn = page.locator('#header-user-button');
    await expect(userBtn).toBeVisible();
    await expect(userBtn).toContainText(/sign in/i);

    // 2. Click to open modal
    await userBtn.click();
    await expect(page.locator('#customer-auth-modal-content')).toBeVisible();
    await expect(page.getByText(/sign in to vault/i)).toBeVisible();

    // 3. Switch to Sign Up mode
    const switchSignUp = page.locator('#customer-auth-switch-signup');
    await expect(switchSignUp).toBeVisible();
    await switchSignUp.click();

    await expect(page.getByText(/create collector account/i)).toBeVisible();
    await expect(page.locator('#customer-auth-name')).toBeVisible();

    // 4. Switch back to Sign In mode
    const switchSignIn = page.locator('#customer-auth-switch-signin');
    await expect(switchSignIn).toBeVisible();
    await switchSignIn.click();

    await expect(page.getByText(/sign in to vault/i)).toBeVisible();

    // 5. Close modal
    await page.locator('#customer-auth-close-btn').click();
    await expect(page.locator('#customer-auth-modal-content')).not.toBeVisible();
  });

  test('CUST-AUTH-02: Customer Sign Up creates account, assigns customer role, and logs in', async ({ page }) => {
    // Open auth modal
    await page.locator('#header-user-button').click();
    await page.locator('#customer-auth-switch-signup').click();

    // Fill form
    await page.locator('#customer-auth-name').fill('Lindiwe Khumalo');
    await page.locator('#customer-auth-email').fill('lindiwe.k@kixora.co.za');
    await page.locator('#customer-auth-password').fill('VaultPass2026!');
    await page.locator('#customer-auth-phone').fill('+27 83 555 1234');

    // Submit
    await page.locator('#customer-auth-submit-btn').click();

    // Verify modal closes and header updates to authenticated collector
    await expect(page.locator('#customer-auth-modal-content')).not.toBeVisible();
    const userBtn = page.locator('#header-user-button');
    await expect(userBtn).toBeVisible();
    await expect(userBtn).toContainText(/lindiwe/i);

    // Verify stored session role is customer
    const session = await page.evaluate(() => {
      const raw = localStorage.getItem('kixora_auth_session');
      return raw ? JSON.parse(raw) : null;
    });
    expect(session).not.toBeNull();
    expect(session.user.role).toBe('customer');
    expect(session.user.fullName).toBe('Lindiwe Khumalo');
  });

  test('CUST-AUTH-03: Customer Sign In with valid credentials authenticates successfully', async ({ page }) => {
    // Open modal
    await page.locator('#header-user-button').click();

    // Fill credentials
    await page.locator('#customer-auth-email').fill('collector.john@example.com');
    await page.locator('#customer-auth-password').fill('SecretKey123');

    // Submit
    await page.locator('#customer-auth-submit-btn').click();

    // Verify authenticated state
    await expect(page.locator('#customer-auth-modal-content')).not.toBeVisible();
    const userBtn = page.locator('#header-user-button');
    await expect(userBtn).toBeVisible();

    // Check account modal
    await userBtn.click();
    await expect(page.locator('#customer-profile-view')).toBeVisible();
    await expect(page.getByText(/verified collector/i)).toBeVisible();
  });

  test('CUST-AUTH-04: Invalid credentials or missing fields display user-friendly error message', async ({ page }) => {
    await page.locator('#header-user-button').click();

    // 1. Try to switch to signup and submit short password
    await page.locator('#customer-auth-switch-signup').click();
    await page.locator('#customer-auth-name').fill('Test User');
    await page.locator('#customer-auth-email').fill('test@example.com');
    await page.locator('#customer-auth-password').fill('123'); // short password
    await page.locator('#customer-auth-submit-btn').click();

    await expect(page.locator('#customer-auth-error')).toBeVisible();
    await expect(page.locator('#customer-auth-error')).toContainText(/at least 6 characters/i);
  });

  test('CUST-AUTH-05: Authenticated customer session persists across browser page reloads', async ({ page }) => {
    // Seed authenticated session
    await page.evaluate(() => {
      const session = {
        user: {
          id: 'usr_persisted_01',
          email: 'sipho.d@kixora.com',
          role: 'customer',
          fullName: 'Sipho Dlamini',
          phone: '+27 82 999 8888',
          appMetadata: { role: 'customer' },
          userMetadata: { full_name: 'Sipho Dlamini' },
        },
        accessToken: 'mock_jwt_sipho',
      };
      localStorage.setItem('kixora_auth_session', JSON.stringify(session));
    });

    await page.reload();

    // Check header displays authenticated state immediately
    const userBtn = page.locator('#header-user-button');
    await expect(userBtn).toBeVisible();
    await expect(userBtn).toContainText(/sipho/i);

    // Open profile modal
    await userBtn.click();
    await expect(page.locator('#customer-profile-view')).toBeVisible();
    await expect(page.getByText('Sipho Dlamini')).toBeVisible();
    await expect(page.getByText('sipho.d@kixora.com')).toBeVisible();
  });

  test('CUST-AUTH-06: Customer can inspect profile, use quick actions, and Sign Out', async ({ page }) => {
    // Seed session
    await page.evaluate(() => {
      const session = {
        user: {
          id: 'usr_active_01',
          email: 'thandeka@kixora.com',
          role: 'customer',
          fullName: 'Thandeka Mthembu',
          appMetadata: { role: 'customer' },
          userMetadata: { full_name: 'Thandeka Mthembu' },
        },
        accessToken: 'mock_jwt_thandeka',
      };
      localStorage.setItem('kixora_auth_session', JSON.stringify(session));
    });

    await page.reload();

    // Open profile
    await page.locator('#header-user-button').click();
    await expect(page.locator('#customer-profile-view')).toBeVisible();

    // Click quick action "Saved Grails & Wishlist"
    await page.locator('#customer-profile-wishlist-btn').click();
    await expect(page.locator('#customer-auth-modal-content')).not.toBeVisible();
    await expect(page.locator('#wishlist-modal-backdrop')).toBeVisible();

    // Close wishlist
    await page.locator('#wishlist-close-btn').click();

    // Reopen profile and Sign Out
    await page.locator('#header-user-button').click();
    await page.locator('#customer-auth-signout-btn').click();

    // Verify logged out state in header
    await expect(page.locator('#header-user-button')).toContainText(/sign in/i);

    // Verify session removed from localStorage
    const sessionAfter = await page.evaluate(() => localStorage.getItem('kixora_auth_session'));
    expect(sessionAfter).toBeNull();
  });

  test('CUST-AUTH-07: Customer storefront domain strictly hides Admin controls', async ({ page }) => {
    // On customer domain, verify header admin button is not rendered
    const adminProfileBtn = page.locator('#header-admin-profile-button');
    await expect(adminProfileBtn).not.toBeVisible();

    // Check desktop navigation items do not include "Admin"
    const navText = await page.locator('nav').textContent();
    expect(navText?.toLowerCase()).not.toContain('admin');
  });

});
