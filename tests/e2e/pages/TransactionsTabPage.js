export class TransactionsTabPage {
  constructor(page) {
    this.page = page;
    this.speakReceiptButton = page.locator('button[data-tutorial="expense-speak-btn"]');
    this.scanReceiptButton = page.locator('button[data-tutorial="expense-scan-btn"]');
    this.addExpenseButton = page.locator('button[data-tutorial="expense-add-btn"]');
    this.transactionRows = page.locator('tbody tr');

    // Add / Edit Transaction Modal
    this.transactionModal = page.locator('div.fixed.inset-0').filter({ hasText: /Expense/i });
    this.descriptionInput = this.transactionModal.locator('input[name="description"]');
    this.amountInput = this.transactionModal.locator('input[name="amount"]');
    this.categorySelect = this.transactionModal.locator('select[name="categoryId"]');
    this.dateInput = this.transactionModal.locator('input[name="date"]');
    this.saveButton = this.transactionModal.locator('button[type="submit"]');
    this.deleteButton = this.transactionModal.locator('button:has-text("Delete")');
    this.cancelButton = this.transactionModal.locator('button:has-text("Cancel")');

    // Receipt Scanner Modal
    this.scannerModal = page.locator('div.fixed.inset-0').filter({ hasText: /Scan Receipt/i });
    this.fileUploadInput = this.scannerModal.locator('input[type="file"]');
  }

  async openAddTransaction() {
    await this.addExpenseButton.click();
  }

  async createTransaction({ description, amount, categoryIndex = 0 }) {
    await this.openAddTransaction();
    await this.descriptionInput.fill(description);
    await this.amountInput.fill(String(amount));
    if (await this.categorySelect.count() > 0) {
      await this.categorySelect.selectOption({ index: categoryIndex });
    }
    await this.saveButton.click();
  }

  async openReceiptScanner() {
    await this.scanReceiptButton.click();
  }

  async toggleVoicePanel() {
    await this.speakReceiptButton.click();
  }
}
