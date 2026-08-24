import { test as base, expect, Page } from '@playwright/test';

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
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
      });
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await use();
    },
    { auto: true },
  ],

  customerPage: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForSelector('header', { state: 'visible' });
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    await page.goto('/');
    const adminBtn = page.locator('#header-admin-profile-button');
    await adminBtn.click();
    await page.waitForSelector('#admin-nav-dashboard', { state: 'visible' });
    await use(page);
  },
});

export { expect };
