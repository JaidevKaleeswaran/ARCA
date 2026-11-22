import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage.js';
import { BasePage } from './pages/BasePage.js';
import { HomeTabPage } from './pages/HomeTabPage.js';
import { TransactionsTabPage } from './pages/TransactionsTabPage.js';

test.describe('Mobile Phone Viewport (390x844 iPhone 14) — Responsive UX & No Horizontal Overflow', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.setItem('arca_tutorial_home_guest', 'true');
      sessionStorage.setItem('arca_tutorial_assistant_guest', 'true');
      sessionStorage.setItem('arca_tutorial_markets_guest', 'true');
      sessionStorage.setItem('arca_tutorial_summary_guest', 'true');
      sessionStorage.setItem('arca_tutorial_transactions_guest', 'true');
    });
    await page.reload();
    await authPage.loginAsGuest();
  });

  test('Renders all 5 tabs and modals cleanly on a mobile phone without horizontal overflow', async ({ page }) => {
    const basePage = new BasePage(page);
    const homePage = new HomeTabPage(page);
    const txPage = new TransactionsTabPage(page);

    // Helper to assert no horizontal document overflow on mobile viewport
    const assertNoHorizontalOverflow = async () => {
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });
      expect(overflow).toBe(false);
    };

    // 1. Home Tab
    await expect(homePage.leftToBudgetBanner).toBeVisible();
    await assertNoHorizontalOverflow();

    // Set salary and create a category on mobile
    await homePage.setSalary(5000, 'monthly');
    await homePage.createCategory('Mobile Housing', 1500);
    await expect(page.locator('h3:has-text("Mobile Housing")')).toBeVisible();
    await assertNoHorizontalOverflow();

    // 2. AI Assistant Tab
    await basePage.selectTab('assistant');
    await expect(page.locator('text=AI Financial Assistant')).toBeVisible();
    await assertNoHorizontalOverflow();

    // 3. Markets Tab
    await basePage.selectTab('markets');
    await expect(page.locator('text=Market Browser & Live Portfolio')).toBeVisible();
    await assertNoHorizontalOverflow();

    // 4. Summary Tab
    await basePage.selectTab('summary');
    await expect(page.locator('[data-tutorial="summary-health-cards"]')).toBeVisible();
    await assertNoHorizontalOverflow();

    // 5. Expenses Tab
    await basePage.selectTab('transactions');
    await txPage.createTransaction({ description: 'Mobile Coffee Shop', amount: 6.50 });
    await expect(page.locator('text=Mobile Coffee Shop')).toBeVisible();
    await assertNoHorizontalOverflow();
  });
});
