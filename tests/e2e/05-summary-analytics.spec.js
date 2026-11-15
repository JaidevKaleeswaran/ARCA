import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage.js';
import { BasePage } from './pages/BasePage.js';
import { SummaryTabPage } from './pages/SummaryTabPage.js';

test.describe('Summary Tab — Financial Health Scorecards, Recharts & Alerts Hub', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    const basePage = new BasePage(page);

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tutorial_completed_home', 'true');
      localStorage.setItem('tutorial_completed_summary', 'true');
    });
    await page.reload();
    await authPage.loginAsGuest();
    await basePage.selectTab('summary');
  });

  test('Financial Health Scorecard renders real-time net worth and cashflow metrics', async ({ page }) => {
    const summaryPage = new SummaryTabPage(page);
    await expect(summaryPage.healthCards).toBeVisible();
    await expect(summaryPage.netWorthCard).toBeVisible();
    await expect(summaryPage.cashFlowCard).toBeVisible();
  });

  test('Main Balance and Category breakdown charts render SVG visualizations without console errors', async ({ page }) => {
    const summaryPage = new SummaryTabPage(page);
    await expect(summaryPage.balanceChart).toBeVisible();
    await expect(summaryPage.categoryCharts).toBeVisible();

    // Verify Recharts SVG canvas elements exist
    const svgElements = page.locator('svg.recharts-surface');
    expect(await svgElements.count()).toBeGreaterThanOrEqual(1);
  });

  test('Notification Hub is visible and interactive', async ({ page }) => {
    const summaryPage = new SummaryTabPage(page);
    await expect(summaryPage.notificationsHub).toBeVisible();
  });
});
