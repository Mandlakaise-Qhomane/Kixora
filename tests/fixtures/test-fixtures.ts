import { test as base, expect, Page } from '@playwright/test';

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

  adminPage: async ({ page }, use) => {
    // Skip to admin view directly for testing
    await page.goto('/?domain=admin', { waitUntil: 'commit' });
    await page.waitForSelector('header', { state: 'visible' });
    await stabilizePage(page);
    
    // Set mock admin session before navigation
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
    
    // Reload to apply auth session
    await page.reload({ waitUntil: 'commit' });
    await page.waitForSelector('header', { state: 'visible' });
    await stabilizePage(page);
    await page.locator('#header-admin-profile-button').click();
    await page.waitForSelector('#admin-nav-dashboard', { state: 'visible' });
    
    await use(page);
  },
});

export { expect };
