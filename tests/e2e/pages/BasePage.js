export class BasePage {
  constructor(page) {
    this.page = page;
    this.header = page.locator('header');
    this.logo = page.locator('header').locator('text=ARCA');
    this.userBadge = page.locator('header div.rounded-full').filter({ hasText: /Guest|User/ });
    this.tutorialButton = page.locator('header button:has-text("Tutorial ?")');
    this.logoutButton = page.locator('button[title="Log Out"]');

    // Tab navigation buttons
    this.nav = page.locator('nav[data-tutorial="tab-nav"]');
    this.homeTab = this.nav.locator('button:has-text("Home")');
    this.assistantTab = this.nav.locator('button:has-text("AI Assistant")');
    this.marketsTab = this.nav.locator('button:has-text("Markets")');
    this.summaryTab = this.nav.locator('button:has-text("Summary")');
    this.transactionsTab = this.nav.locator('button:has-text("Expenses")');
  }

  async goto() {
    await this.page.goto('/');
  }

  async selectTab(tabName) {
    switch (tabName.toLowerCase()) {
      case 'home':
        await this.homeTab.click();
        break;
      case 'assistant':
        await this.assistantTab.click();
        break;
      case 'markets':
        await this.marketsTab.click();
        break;
      case 'summary':
        await this.summaryTab.click();
        break;
      case 'transactions':
      case 'expenses':
        await this.transactionsTab.click();
        break;
      default:
        throw new Error(`Unknown tab: ${tabName}`);
    }
    const skipBtn = this.page.locator('button:has-text("Already did tutorial")');
    if (await skipBtn.count() > 0 && await skipBtn.first().isVisible()) {
      await skipBtn.first().click();
    }
  }

  async clickTutorial() {
    await this.tutorialButton.click();
  }

  async clickLogout() {
    await this.logoutButton.click();
  }
}
