export class SummaryTabPage {
  constructor(page) {
    this.page = page;
    this.healthCards = page.locator('[data-tutorial="summary-health-cards"]');
    this.netWorthCard = this.healthCards.locator('div').filter({ hasText: 'Net Worth' }).first();
    this.cashFlowCard = this.healthCards.locator('div').filter({ hasText: 'Cash Flow' }).first();
    this.balanceChart = page.locator('[data-tutorial="summary-balance-chart"]');
    this.categoryCharts = page.locator('[data-tutorial="summary-category-charts"]');
    this.notificationsHub = page.locator('[data-tutorial="summary-notifications"]');
    this.viewMarketsButton = page.locator('button:has-text("View Markets"), button:has-text("Explore Markets")');
  }

  async clickExploreMarkets() {
    await this.viewMarketsButton.click();
  }
}
