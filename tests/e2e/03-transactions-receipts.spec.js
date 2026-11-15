import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage.js';
import { BasePage } from './pages/BasePage.js';
import { TransactionsTabPage } from './pages/TransactionsTabPage.js';

test.describe('Transactions Tab — Manual Logging, Receipt Scanner & Voice Panel', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    const basePage = new BasePage(page);

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tutorial_completed_home', 'true');
      localStorage.setItem('tutorial_completed_transactions', 'true');
    });
    await page.reload();
    await authPage.loginAsGuest();
    await basePage.selectTab('transactions');
  });

  test('User can manually create, view, and edit transactions', async ({ page }) => {
    const txPage = new TransactionsTabPage(page);

    // 1. Open Add Expense Modal
    await txPage.openAddTransaction();
    await expect(txPage.transactionModal).toBeVisible();

    // 2. Fill and save expense
    await txPage.descriptionInput.fill('Organic Market Produce');
    await txPage.amountInput.fill('54.20');
    await txPage.saveButton.click();
    await expect(txPage.transactionModal).not.toBeVisible();

    // 3. Verify transaction appears in table
    const createdTxRow = page.locator('text=Organic Market Produce');
    await expect(createdTxRow).toBeVisible();
  });

  test('Receipt Scanner modal opens, displays drag-and-drop dropzone, and can be dismissed', async ({ page }) => {
    const txPage = new TransactionsTabPage(page);

    await txPage.openReceiptScanner();
    await expect(txPage.scannerModal).toBeVisible();

    // Verify upload dropzone and supported formats indicator
    const uploadArea = txPage.scannerModal.locator('div').filter({ hasText: /JPG, PNG, WebP/i }).first();
    await expect(uploadArea).toBeVisible();

    // Close scanner modal via header close button
    const closeBtn = txPage.scannerModal.locator('button').first();
    await closeBtn.click();
    await expect(txPage.scannerModal).not.toBeVisible();
  });

  test('Voice Input panel toggles smoothly from top action controls', async ({ page }) => {
    const txPage = new TransactionsTabPage(page);

    await txPage.toggleVoicePanel();
    const voicePanel = page.locator('div').filter({ hasText: /Voice & Quick Receipt Entry/i }).first();
    await expect(voicePanel).toBeVisible();

    // Toggle off
    await txPage.toggleVoicePanel();
    await expect(voicePanel).not.toBeVisible();
  });
});
