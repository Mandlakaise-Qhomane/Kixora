import { test as base, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';

async function stabilizePage(page: Page): Promise<void> {
  await page.addStyleTag({
    content: '* { transition-duration: 0s !important; animation-duration: 0s !important; }',
  });
}

// Define custom fixture types
type KixoraFixtures = {
  resetStore: void;
  customerPage: Page;
  adminPage: Page;
};

export const test = base.extend<KixoraFixtures>({
  // Automatically clear localStorage before each test so tests are completely isolated
  resetStore: [
    async ({ page }, use) => {
      await page.goto('/', { waitUntil: 'commit' });
      await page.waitForSelector('header', { state: 'visible' });
      await stabilizePage(page);
      await page.evaluate(() => {
        localStorage.clear();
      });
      await page.reload({ waitUntil: 'commit' });
      await page.waitForSelector('header', { state: 'visible' });
      await stabilizePage(page);
      await page.waitForLoadState('domcontentloaded');
      await use();
    },
    { auto: true },
  ],

  customerPage: async ({ page }, use) => {
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForSelector('header', { state: 'visible' });
    await stabilizePage(page);
    await page.waitForSelector('header', { state: 'visible' });
    await use(page);
  },

  adminPage: async ({ page }, use, testInfo: TestInfo) => {
    const useStagingSupabase = process.env.PLAYWRIGHT_USE_STAGING_SUPABASE === 'true';
    testInfo.skip(
      process.env.CI === 'true' && !useStagingSupabase,
      'Admin browser tests require configured staging Supabase auth in CI.'
    );

    await page.goto('/?domain=admin', { waitUntil: 'commit' });
    await page.waitForSelector('header', { state: 'visible' });
    await stabilizePage(page);
    const adminBtn = page.locator('#header-admin-profile-button');

    if (useStagingSupabase) {
      await adminBtn.click();
      await page.getByPlaceholder('admin@kixora.com').fill(process.env.PLAYWRIGHT_ADMIN_EMAIL!);
      await page.getByPlaceholder('••••••••••••').fill(process.env.PLAYWRIGHT_ADMIN_PASSWORD!);
      await page.getByRole('button', { name: /authenticate to admin console/i }).click();
    } else {
      await page.evaluate(() => {
        const mockAdminSession = {
          user: {
            id: 'admin-001',
            email: 'admin@kixora.com',
            role: 'admin',
            fullName: 'Vault Administrator',
            appMetadata: { role: 'admin' },
            userMetadata: { full_name: 'Vault Administrator' },
            createdAt: new Date().toISOString(),
          },
          accessToken: 'mock_jwt_admin_test',
          expiresAt: Math.floor(Date.now() / 1000) + 86400,
        };
        localStorage.setItem('kixora_auth_session', JSON.stringify(mockAdminSession));
      });
      await page.reload({ waitUntil: 'commit' });
      await page.waitForSelector('header', { state: 'visible' });
      await stabilizePage(page);
      await page.locator('#header-admin-profile-button').click();
    }

    await page.waitForSelector('#admin-nav-dashboard', { state: 'visible' });
    await use(page);
  },
});

export { expect };
