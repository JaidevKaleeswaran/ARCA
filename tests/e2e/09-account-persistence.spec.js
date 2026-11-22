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

  test('Preserves added salary, categories, transactions, and category deletions across page reload and logout/rejoin without adding default categories', async ({ page }) => {
    const authPage = new AuthPage(page);
    const basePage = new BasePage(page);
    const homePage = new HomeTabPage(page);
    const txPage = new TransactionsTabPage(page);

    // 0. Verify no initial default categories (Bills, Groceries, Entertainment) exist on fresh start
    await expect(page.locator('h3:has-text("Bills")')).toHaveCount(0);
    await expect(page.locator('h3:has-text("Groceries")')).toHaveCount(0);
    await expect(page.locator('h3:has-text("Entertainment")')).toHaveCount(0);

    // 1. Add salary, two custom categories, and delete one category on Home tab
    await homePage.setSalary(8250, 'monthly');
    await expect(homePage.salaryModal).not.toBeVisible();

    await homePage.createCategory('Travel Fund', 650);
    await expect(page.locator('h3:has-text("Travel Fund")')).toBeVisible();

    await homePage.createCategory('Temporary Category', 200);
    await expect(page.locator('h3:has-text("Temporary Category")')).toBeVisible();

    // Delete 'Temporary Category' via its card delete button
    const tempHeading = page.locator('h3:has-text("Temporary Category")').first();
    await expect(tempHeading).toBeVisible();
    const tempCard = tempHeading.locator('xpath=ancestor::div[contains(@class, "group")][1]');
    page.once('dialog', (dialog) => dialog.accept());
    await tempCard.locator('button[title="Delete Category"]').click();
    await expect(page.locator('h3:has-text("Temporary Category")')).toHaveCount(0);

    // 2. Add a transaction on Transactions tab
    await basePage.selectTab('transactions');
    await txPage.createTransaction({ description: 'Rejoin Persistence Flight', amount: 185 });
    await expect(page.locator('text=Rejoin Persistence Flight')).toBeVisible();

    // 3. Simulate leaving and reopening the app (page reload without logout)
    await page.reload();

    // User stays authenticated in their session and retains all added/deleted state with no phantom categories
    await expect(basePage.userBadge).toBeVisible();
    await expect(page.locator('h3:has-text("Travel Fund")')).toBeVisible();
    await expect(page.locator('h3:has-text("Temporary Category")')).toHaveCount(0);
    await expect(page.locator('h3:has-text("Bills")')).toHaveCount(0);
    await expect(page.locator('h3:has-text("Groceries")')).toHaveCount(0);
    await expect(page.locator('h3:has-text("Entertainment")')).toHaveCount(0);
    // $8,250 salary - $650 Travel Fund = $7,600.00 Left to Budget
    await expect(homePage.leftToBudgetBanner).toContainText('$7,600.00');
    await expect(page.locator('text=$8,250.00').first()).toBeVisible();

    await basePage.selectTab('transactions');
    await expect(page.locator('text=Rejoin Persistence Flight')).toBeVisible();

    // 4. Simulate explicit logout and rejoining the session
    await basePage.clickLogout();
    await expect(authPage.guestButton).toBeVisible();
    await authPage.loginAsGuest();

    // Verify all data added in the previous session is still intact and no default categories reappeared
    await expect(page.locator('h3:has-text("Travel Fund")')).toBeVisible();
    await expect(page.locator('h3:has-text("Temporary Category")')).toHaveCount(0);
    await expect(page.locator('h3:has-text("Bills")')).toHaveCount(0);
    await expect(page.locator('h3:has-text("Groceries")')).toHaveCount(0);
    await expect(page.locator('h3:has-text("Entertainment")')).toHaveCount(0);
    await expect(homePage.leftToBudgetBanner).toContainText('$7,600.00');
    await expect(page.locator('text=$8,250.00').first()).toBeVisible();

    await basePage.selectTab('transactions');
    await expect(page.locator('text=Rejoin Persistence Flight')).toBeVisible();
  });
});
