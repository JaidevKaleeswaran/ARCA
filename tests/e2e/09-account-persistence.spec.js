import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage.js';
import { BasePage } from './pages/BasePage.js';
import { HomeTabPage } from './pages/HomeTabPage.js';
import { TransactionsTabPage } from './pages/TransactionsTabPage.js';

test.describe('Account Data Saving — Leave & Rejoin Persistence', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await authPage.loginAsGuest();
  });

  test('Preserves added salary, categories, transactions, and category deletions across page reload and logout/rejoin', async ({ page }) => {
    const authPage = new AuthPage(page);
    const basePage = new BasePage(page);
    const homePage = new HomeTabPage(page);
    const txPage = new TransactionsTabPage(page);

    // 1. Add salary, a custom category, and delete a default category on Home tab
    await homePage.setSalary(8250, 'monthly');
    await expect(homePage.salaryModal).not.toBeVisible();

    await homePage.createCategory('Travel Fund', 650);
    await expect(page.locator('h3:has-text("Travel Fund")')).toBeVisible();

    // Delete default 'Entertainment' category via its card delete button
    const entertainmentHeading = page.locator('h3:has-text("Entertainment")').first();
    await expect(entertainmentHeading).toBeVisible();
    const entertainmentCard = entertainmentHeading.locator('xpath=ancestor::div[contains(@class, "group")][1]');
    page.once('dialog', (dialog) => dialog.accept());
    await entertainmentCard.locator('button[title="Delete Category"]').click();
    await expect(page.locator('h3:has-text("Entertainment")')).toHaveCount(0);

    // 2. Add a transaction on Transactions tab
    await basePage.selectTab('transactions');
    await txPage.createTransaction({ description: 'Rejoin Persistence Flight', amount: 185 });
    await expect(page.locator('text=Rejoin Persistence Flight')).toBeVisible();

    // 3. Simulate leaving and reopening the app (page reload without logout)
    await page.reload();

    // User stays authenticated in their session and retains all added/deleted state
    await expect(basePage.userBadge).toBeVisible();
    await expect(page.locator('h3:has-text("Travel Fund")')).toBeVisible();
    await expect(page.locator('h3:has-text("Entertainment")')).toHaveCount(0);
    // $8,250 salary - ($1,000 Bills + $400 Groceries + $650 Travel Fund) = $6,200.00 Left to Budget
    await expect(homePage.leftToBudgetBanner).toContainText('$6,200.00');
    await expect(page.locator('text=$8,250.00').first()).toBeVisible();

    await basePage.selectTab('transactions');
    await expect(page.locator('text=Rejoin Persistence Flight')).toBeVisible();

    // 4. Simulate explicit logout and rejoining the session
    await basePage.clickLogout();
    await expect(authPage.guestButton).toBeVisible();
    await authPage.loginAsGuest();

    // Verify all data added in the previous session is still intact
    await expect(page.locator('h3:has-text("Travel Fund")')).toBeVisible();
    await expect(page.locator('h3:has-text("Entertainment")')).toHaveCount(0);
    await expect(homePage.leftToBudgetBanner).toContainText('$6,200.00');
    await expect(page.locator('text=$8,250.00').first()).toBeVisible();

    await basePage.selectTab('transactions');
    await expect(page.locator('text=Rejoin Persistence Flight')).toBeVisible();
  });
});
