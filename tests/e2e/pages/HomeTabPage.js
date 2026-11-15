export class HomeTabPage {
  constructor(page) {
    this.page = page;
    this.leftToBudgetBanner = page.locator('[data-tutorial="budget-banner"]');
    this.editSalaryButton = page.locator('button:has-text("Set Base Salary"), button[title="Edit Base Salary"], button:has-text("Edit Salary")').first();
    this.addIncomeSourceButton = page.locator('button:has-text("Add Source")');
    this.quickFillButton = page.locator('button[data-tutorial="quick-fill"]');
    this.addCategoryButton = page.locator('button[data-tutorial="category-add"]');
    this.stocksWidget = page.locator('div').filter({ hasText: 'Equity & ETF Portfolio Value' }).first();
    this.viewMarketsButton = this.stocksWidget.locator('button').filter({ hasText: /Markets/ }).first();

    // Salary Modal
    this.salaryModal = page.locator('div.fixed.inset-0').filter({ hasText: /Salary/i });
    this.salaryInput = this.salaryModal.locator('input[type="number"]').first();
    this.salaryFrequencySelect = this.salaryModal.locator('select');
    this.salarySaveButton = this.salaryModal.locator('button[type="submit"]');
    this.salaryCancelButton = this.salaryModal.locator('button:has-text("Cancel")');

    // Category Modal
    this.categoryModal = page.locator('div.fixed.inset-0').filter({ hasText: 'Category' });
    this.categoryNameInput = this.categoryModal.locator('input[name="name"], input[placeholder*="Groceries"]');
    this.categoryLimitInput = this.categoryModal.locator('input[name="limit"], input[type="number"]');
    this.categorySubmitButton = this.categoryModal.locator('button[type="submit"]');
    this.categoryDeleteButton = this.categoryModal.locator('button:has-text("Delete")');
  }

  async openSalaryModal() {
    await this.editSalaryButton.click();
  }

  async setSalary(amount, frequency = 'monthly') {
    await this.openSalaryModal();
    await this.salaryInput.fill(String(amount));
    if (frequency) {
      await this.salaryFrequencySelect.selectOption(frequency);
    }
    await this.salarySaveButton.click();
  }

  async openAddCategory() {
    await this.addCategoryButton.click();
  }

  async createCategory(name, limit) {
    await this.openAddCategory();
    await this.categoryNameInput.fill(name);
    await this.categoryLimitInput.fill(String(limit));
    await this.categorySubmitButton.click();
  }

  async triggerQuickFill(presetName = '50/30/20') {
    await this.quickFillButton.click();
    await this.page.locator(`button:has-text("${presetName}")`).click();
  }
}
