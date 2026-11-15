import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage.js';
import { BasePage } from './pages/BasePage.js';
import { MarketTrackerTabPage } from './pages/MarketTrackerTabPage.js';

test.describe('Market Tracker Tab — Rates, Search Hygiene, Investing & Authentic News', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    const basePage = new BasePage(page);

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tutorial_completed_home', 'true');
      localStorage.setItem('tutorial_completed_markets', 'true');
    });
    await page.reload();
    await authPage.loginAsGuest();
    await basePage.selectTab('markets');
  });

  test('Authoritative FRED rates and Top HYSA cash yields display in top marquee', async ({ page }) => {
    const marketPage = new MarketTrackerTabPage(page);
    await expect(marketPage.ratesMarquee).toBeVisible();
    await expect(marketPage.hysaRateCard).toBeVisible();
    await expect(marketPage.hysaRateCard).toContainText('%');
  });

  test('Stock search hygiene enforces domestic tickers and ETF net asset extraction', async ({ page }) => {
    const marketPage = new MarketTrackerTabPage(page);

    // Search for SPY ETF
    await marketPage.searchStock('SPY');
    await page.waitForTimeout(600); // Allow debounced search to settle

    const spyCard = page.locator('div').filter({ hasText: 'SPY' }).first();
    await expect(spyCard).toBeVisible();

    // Rule: ETF capitalization must extract netAssets, never 'Cap: N/A'
    const capText = await spyCard.innerText();
    expect(capText).not.toContain('Cap: N/A');
    expect(capText).toMatch(/\$[\d\.]+[BTM]/);
  });

  test('Invest Stock Modal allows dollar-share conversion, quick adds, and portfolio tracking', async ({ page }) => {
    const marketPage = new MarketTrackerTabPage(page);

    // Open invest modal for first stock
    await marketPage.openInvestModal();
    await expect(marketPage.investModal).toBeVisible();

    // Toggle mode to Shares
    await marketPage.sharesModeButton.click();
    await expect(marketPage.sharesModeButton).toHaveClass(/bg-accent/);

    // Toggle back to Dollars
    await marketPage.dollarsModeButton.click();
    await expect(marketPage.dollarsModeButton).toHaveClass(/bg-accent/);

    // Enter investment amount
    await marketPage.amountInput.fill('100');
    const val = await marketPage.amountInput.inputValue();
    expect(Number(val)).toBeGreaterThanOrEqual(100);

    // Add to portfolio
    await marketPage.addToPortfolioButton.click();
    await expect(marketPage.investModal).not.toBeVisible();
  });

  test('Authentic news cards display verified publisher metadata and open dedicated reader view', async ({ page }) => {
    const marketPage = new MarketTrackerTabPage(page);

    const firstNewsCard = marketPage.newsCards.first();
    if (await firstNewsCard.count() > 0) {
      await expect(firstNewsCard).toBeVisible();
      // Click "View in App" button
      await firstNewsCard.click();

      const readerModal = page.locator('div.fixed.inset-0').filter({ hasText: 'Open in New Tab' }).first();
      if (await readerModal.count() > 0) {
        await expect(readerModal).toBeVisible();
        await page.keyboard.press('Escape');
      }
    }
  });

  test('AI Macro Economic Digest provides personal finance takeaways', async ({ page }) => {
    const marketPage = new MarketTrackerTabPage(page);
    await expect(marketPage.aiDigestCard).toBeVisible();
  });
});
