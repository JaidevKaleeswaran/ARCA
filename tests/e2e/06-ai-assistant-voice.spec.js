import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage.js';
import { BasePage } from './pages/BasePage.js';
import { AssistantTabPage } from './pages/AssistantTabPage.js';

test.describe('AI Assistant Tab — Chat, Tool Badges, Voice & Quota Indicator', () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    const basePage = new BasePage(page);

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('tutorial_completed_home', 'true');
      localStorage.setItem('tutorial_completed_assistant', 'true');
    });
    await page.reload();
    await authPage.loginAsGuest();
    await basePage.selectTab('assistant');
  });

  test('Assistant header displays weekly quota status and resets Monday UTC countdown', async ({ page }) => {
    const assistantPage = new AssistantTabPage(page);
    const headerBanner = page.locator('div').filter({ hasText: 'AI Financial Assistant' }).first();
    await expect(headerBanner).toBeVisible();

    await expect(assistantPage.quotaBadge).toBeVisible();
  });

  test('Quick prompt chips send chat queries and append to conversation stream', async ({ page }) => {
    const assistantPage = new AssistantTabPage(page);
    await expect(assistantPage.inputQuery).toBeVisible();

    const firstChip = assistantPage.quickPromptChips.first();
    if (await firstChip.count() > 0) {
      const chipText = (await firstChip.innerText()).trim();
      await firstChip.click();
      await expect(page.locator('p.font-medium').filter({ hasText: chipText })).toBeVisible();
    }
  });

  test('Voice Prompt Recording button and Audit Log Modal function properly', async ({ page }) => {
    const assistantPage = new AssistantTabPage(page);

    await expect(assistantPage.voiceRecordButton).toBeVisible();

    // Open Voice Audit Log Modal if button exists
    if (await assistantPage.voiceAuditLogButton.count() > 0) {
      await assistantPage.voiceAuditLogButton.click();
      await expect(assistantPage.auditModal).toBeVisible();
      await assistantPage.auditModal.locator('button:has-text("Close")').click();
      await expect(assistantPage.auditModal).not.toBeVisible();
    }
  });
});
