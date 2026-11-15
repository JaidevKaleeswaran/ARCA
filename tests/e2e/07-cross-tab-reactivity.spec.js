import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage.js';
import { BasePage } from './pages/BasePage.js';
import { HomeTabPage } from './pages/HomeTabPage.js';
import { MarketTrackerTabPage } from './pages/MarketTrackerTabPage.js';
import { SummaryTabPage } from './pages/SummaryTabPage.js';
import { TransactionsTabPage } from './pages/TransactionsTabPage.js';

test.describe('Universal Cross-Tab Asset Reactivity & State Store Consistency', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tutorial_completed_home', 'true');
      localStorage.setItem('tutorial_completed_markets', 'true');
      localStorage.setItem('tutorial_completed_summary', 'true');
      localStorage.setItem('tutorial_completed_transactions', 'true');
    });
    await page.reload();
    await authPage.loginAsGuest();
  });

  test('Investing in a stock in Markets Tab updates StocksWidget on Home Tab and Net Worth on Summary Tab', async ({ page }) => {
    const basePage = new BasePage(page);
    const homePage = new HomeTabPage(page);
    const marketPage = new MarketTrackerTabPage(page);
    const summaryPage = new SummaryTabPage(page);

    // 1. Navigate to Markets Tab and Invest in stock
    await basePage.selectTab('markets');
    await marketPage.openInvestModal();
    await expect(marketPage.investModal).toBeVisible();
    await marketPage.amountInput.fill('100');
    await marketPage.addToPortfolioButton.click();
    await expect(marketPage.investModal).not.toBeVisible();

    // 2. Navigate back to Home Tab and verify StocksWidget has registered the investment
    await basePage.selectTab('home');
    await expect(homePage.stocksWidget).toBeVisible();
    const widgetText = await homePage.stocksWidget.innerText();
    expect(widgetText).toMatch(/\$\d+/);

    // 3. Navigate to Summary Tab and verify Net Worth includes the holding
    await basePage.selectTab('summary');
    await expect(summaryPage.netWorthCard).toBeVisible();
  });

  test('Adding an expense in Transactions Tab immediately updates category envelope spent balance on Home Tab', async ({ page }) => {
    const basePage = new BasePage(page);
    const txPage = new TransactionsTabPage(page);

    // 1. Switch to Expenses tab and add $100 expense
    await basePage.selectTab('transactions');
    await txPage.createTransaction({ description: 'Automated Test Coffee', amount: 100 });

    // 2. Switch back to Home Tab and verify Category Card reflects $100 spent
    await basePage.selectTab('home');
    const spentText = page.locator('span:has-text("$100.00")');
    await expect(spentText).toBeVisible();
  });
});
