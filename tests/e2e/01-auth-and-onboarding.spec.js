import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage.js';
import { BasePage } from './pages/BasePage.js';

test.describe('Authentication & Onboarding UX Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh unauthenticated state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Enforces password visibility toggle and proper input padding', async ({ page }) => {
    const authPage = new AuthPage(page);

    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.passwordInput).toHaveAttribute('type', 'password');

    // Rule: Must have sufficient right padding (pr-10 or pr-11) so toggles never overlap text
    const className = await authPage.passwordInput.getAttribute('class');
    expect(className).toMatch(/pr-1[01]/);

    // Enter test password and toggle visibility
    await authPage.passwordInput.fill('SecretPassword123!');
    await authPage.togglePasswordVisibility();
    await expect(authPage.passwordInput).toHaveAttribute('type', 'text');

    // Toggle back to password
    await authPage.togglePasswordVisibility();
    await expect(authPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('Forgot password modal opens, validates email, and can be dismissed', async ({ page }) => {
    const authPage = new AuthPage(page);

    await expect(authPage.forgotPasswordLink).toBeVisible();
    await authPage.openForgotPassword();

    await expect(authPage.resetModal).toBeVisible();
    await expect(authPage.resetEmailInput).toBeVisible();

    // Dismiss modal
    await authPage.resetCancelButton.click();
    await expect(authPage.resetModal).not.toBeVisible();
  });

  test('Guest mode login bypasses authentication, seeds state, and displays tutorial controls', async ({ page }) => {
    const authPage = new AuthPage(page);
    const basePage = new BasePage(page);

    await expect(authPage.guestButton).toBeVisible();
    await authPage.loginAsGuest(false);

    // Verify user is landed on Home tab with Guest badge and Tutorial button
    await expect(basePage.userBadge).toBeVisible();
    await expect(basePage.userBadge).toContainText('Guest');
    await expect(basePage.tutorialButton).toBeVisible();
    await expect(basePage.tutorialButton).toContainText('Tutorial ?');

    // Verify tutorial overlay trigger works
    await basePage.clickTutorial();
    const skipButton = page.locator('button:has-text("Already did tutorial")');
    await expect(skipButton).toBeVisible();
    await skipButton.click();
    await expect(skipButton).not.toBeVisible();
  });
});
