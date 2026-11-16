export class AssistantTabPage {
  constructor(page) {
    this.page = page;
    this.inputQuery = page.locator('input[placeholder*="Ask about your spending"]');
    this.sendButton = page.locator('button[data-tutorial="ai-input-bar"] button').last();
    this.voiceRecordButton = page.locator('button[data-tutorial="ai-voice-mic"]');
    this.quotaBadge = page.locator('button[title="Weekly AI Assistant Quota"], span:has-text("ARCA Pro"), span:has-text("Unlimited")').first();
    this.quickPromptChips = page.locator('div[data-tutorial="ai-quick-questions"] button');
    this.voiceAuditLogButton = page.locator('button:has-text("Voice Logs")');

    // Voice Audit Log Modal
    this.auditModal = page.locator('div.fixed.inset-0').filter({ hasText: /Voice.*Log/i });
    this.auditSearchInput = this.auditModal.locator('input[placeholder*="Search"]');
    this.clearAuditLogsButton = this.auditModal.locator('button:has-text("Clear Logs")');
    this.closeAuditModalButton = this.auditModal.locator('button').first();
  }

  async sendQuery(query) {
    await this.inputQuery.fill(query);
    await this.sendButton.click();
  }
}
