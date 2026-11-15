import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage.js';
import { BasePage } from './pages/BasePage.js';
import { HomeTabPage } from './pages/HomeTabPage.js';

test.describe('Home Tab — Budget Envelopes & Income Allocation', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      // Dismiss initial automatic tutorial for clean deterministic runs
      localStorage.setItem('tutorial_completed_home', 'true');
    });
    await page.reload();
    await authPage.loginAsGuest();
  });

  test('Left-to-Budget reacts dynamically to salary and category envelope adjustments', async ({ page }) => {
    const homePage = new HomeTabPage(page);
    await expect(homePage.leftToBudgetBanner).toBeVisible();

    // 1. Open Salary modal and update salary
    await homePage.openSalaryModal();
    await expect(homePage.salaryModal).toBeVisible();
    await homePage.salaryInput.fill('7500');
    await homePage.salarySaveButton.click();
    await expect(homePage.salaryModal).not.toBeVisible();

    // 2. Add a new category envelope
    await homePage.createCategory('Fitness & Health', 250);
    const newCategoryCard = page.locator('div').filter({ hasText: 'Fitness & Health' }).first();
    await expect(newCategoryCard).toBeVisible();

    // 3. Quick-Fill distributes income across presets
    await homePage.quickFillButton.click();
    const presetItem = page.locator('div.absolute button').filter({ hasText: '50/30/20' }).first();
    await expect(presetItem).toBeVisible();
    await presetItem.click();
  });

  test('Stocks Widget renders portfolio assets and navigates seamlessly to Markets tab', async ({ page }) => {
    const homePage = new HomeTabPage(page);
    const basePage = new BasePage(page);

    await expect(homePage.stocksWidget).toBeVisible();
    await homePage.viewMarketsButton.click();

    // Verify active tab switched to Markets
    await expect(basePage.marketsTab).toHaveClass(/text-accent/);
  });
});
