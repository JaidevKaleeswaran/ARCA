export class MarketTrackerTabPage {
  constructor(page) {
    this.page = page;
    this.ratesMarquee = page.locator('div[data-tutorial="market-rates-panel"], div:has-text("Interest Rates & Treasury Benchmarks")').first();
    this.hysaRateCard = page.locator('div').filter({ hasText: /High-Yield Savings|Top HYSA|HYSA/i }).first();
    this.searchInput = page.locator('input[placeholder*="Search any stock"]');
    this.sectorPills = page.locator('button.rounded-md');
    this.stockCards = page.locator('div').filter({ hasText: /Invest in/i });
    this.firstInvestButton = page.locator('button:has-text("Invest in")').first();

    // Invest Modal
    this.investModal = page.locator('div.fixed.inset-0').filter({ hasText: /Investment Method|Confirm & Add/i });
    this.dollarsModeButton = this.investModal.locator('button:has-text("Dollar Amount ($)")');
    this.sharesModeButton = this.investModal.locator('button:has-text("Number of Shares")');
    this.amountInput = this.investModal.locator('input[type="number"]').first();
    this.quickAdd50 = this.investModal.getByRole('button', { name: '+$50', exact: true });
    this.addToPortfolioButton = this.investModal.locator('button:has-text("Confirm & Add to Portfolio")');
    this.closeModalButton = this.investModal.locator('button:has-text("Cancel")');

    // News & AI Digest
    this.newsCards = page.locator('div').filter({ hasText: 'View in App' });
    this.aiDigestCard = page.locator('div[data-tutorial="market-ai-digest"]');
    this.regenerateDigestButton = this.aiDigestCard.locator('button');
  }

  async searchStock(ticker) {
    await this.searchInput.fill(ticker);
  }

  async openInvestModal() {
    await this.firstInvestButton.click();
  }

  async investInStock(amount) {
    await this.openInvestModal();
    await this.amountInput.fill(String(amount));
    await this.addToPortfolioButton.click();
  }
}
