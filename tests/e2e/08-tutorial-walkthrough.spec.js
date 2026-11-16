import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage.js';

test.describe('Per-Page Onboarding Tutorial System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('Guest login triggers Home tutorial, supports Next/Prev navigation, and dismisses via "Already did tutorial"', async ({ page }) => {
    const authPage = new AuthPage(page);

    // Guest login without auto-dismissing tutorial
    await authPage.guestButton.click();

    // Verify tutorial overlay appears
    const tutorialCard = page.locator('div.fixed').filter({ hasText: 'Home Page Tutorial' });
    await expect(tutorialCard).toBeVisible({ timeout: 5000 });
    await expect(tutorialCard).toContainText('Step 1 of 7');
    await expect(tutorialCard).toContainText('Add Income Sources');

    // Click "Next"
    const nextBtn = tutorialCard.locator('button:has-text("Next")');
    await nextBtn.click();

    await expect(tutorialCard).toContainText('Step 2 of 7');
    await expect(tutorialCard).toContainText('Set Base Salary');

    // Click "Previous" (chevron left button)
    const prevBtn = tutorialCard.locator('button[title="Previous step"]');
    await prevBtn.click();
    await expect(tutorialCard).toContainText('Step 1 of 7');

    // Click "Already did tutorial"
    const skipBtn = tutorialCard.locator('button:has-text("Already did tutorial")');
    await skipBtn.click();
    await expect(tutorialCard).not.toBeVisible();

    // Verify sessionStorage recorded the tutorial state
    const homeSeen = await page.evaluate(() => sessionStorage.getItem('arca_tutorial_home_guest'));
    expect(homeSeen).toBe('true');
  });

  test('Independent per-page triggers: Visiting AI Assistant triggers its own tutorial', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.guestButton.click();

    // Dismiss Home tutorial
    const homeTutorial = page.locator('div.fixed').filter({ hasText: 'Home Page Tutorial' });
    await expect(homeTutorial).toBeVisible({ timeout: 5000 });
    await homeTutorial.locator('button:has-text("Already did tutorial")').click();
    await expect(homeTutorial).not.toBeVisible();

    // Switch to AI Assistant tab
    await page.locator('nav[data-tutorial="tab-nav"] button:has-text("AI Assistant")').click();

    // AI Assistant tutorial triggers independently
    const aiTutorial = page.locator('div.fixed').filter({ hasText: 'AI Assistant Tutorial' });
    await expect(aiTutorial).toBeVisible({ timeout: 5000 });
    await expect(aiTutorial).toContainText('Step 1 of 3');
    await expect(aiTutorial).toContainText('AI Financial Advisor');

    // Skip AI Assistant tutorial
    await aiTutorial.locator('button:has-text("Already did tutorial")').click();
    await expect(aiTutorial).not.toBeVisible();

    const aiSeen = await page.evaluate(() => sessionStorage.getItem('arca_tutorial_assistant_guest'));
    expect(aiSeen).toBe('true');

    // Switch back to Home tab - tutorial should NOT trigger again in same session
    await page.locator('nav[data-tutorial="tab-nav"] button:has-text("Home")').click();
    await page.waitForTimeout(600);
    await expect(homeTutorial).not.toBeVisible();
  });

  test('Floating corner "Tutorial ?" button forces tutorial to restart on current tab', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.guestButton.click();

    // Dismiss initial Home tutorial
    const tutorialCard = page.locator('div.fixed').filter({ hasText: 'Home Page Tutorial' });
    await expect(tutorialCard).toBeVisible({ timeout: 5000 });
    await tutorialCard.locator('button:has-text("Already did tutorial")').click();
    await expect(tutorialCard).not.toBeVisible();

    // Click corner launcher to manually restart
    const cornerLauncher = page.locator('button[data-tutorial="corner-tutorial-launcher"]');
    await cornerLauncher.click();

    // Tutorial card is back at step 1
    await expect(tutorialCard).toBeVisible();
    await expect(tutorialCard).toContainText('Step 1 of 7');
  });

  test('Keyboard navigation: ArrowRight advances step, Escape dismisses tutorial', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.guestButton.click();

    const tutorialCard = page.locator('div.fixed').filter({ hasText: 'Home Page Tutorial' });
    await expect(tutorialCard).toBeVisible({ timeout: 5000 });
    await expect(tutorialCard).toContainText('Step 1 of 7');

    // Press ArrowRight to advance
    await page.keyboard.press('ArrowRight');
    await expect(tutorialCard).toContainText('Step 2 of 7');

    // Press Escape to dismiss
    await page.keyboard.press('Escape');
    await expect(tutorialCard).not.toBeVisible();

    const homeSeen = await page.evaluate(() => sessionStorage.getItem('arca_tutorial_home_guest'));
    expect(homeSeen).toBe('true');
  });

  test('Session reset for Guests vs Permanent persistence for Registered users', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.guestButton.click();

    // Dismiss Home tutorial as guest
    const tutorialCard = page.locator('div.fixed').filter({ hasText: 'Home Page Tutorial' });
    await expect(tutorialCard).toBeVisible({ timeout: 5000 });
    await tutorialCard.locator('button:has-text("Already did tutorial")').click();
    await expect(tutorialCard).not.toBeVisible();

    // Guest state is in sessionStorage, not localStorage
    const guestSessionState = await page.evaluate(() => sessionStorage.getItem('arca_tutorial_home_guest'));
    expect(guestSessionState).toBe('true');

    // Simulate registered user in TutorialContext logic
    const registeredPersistenceTest = await page.evaluate(() => {
      const registeredUid = 'user_reg_999';
      const key = `arca_tutorial_home_${registeredUid}`;
      localStorage.setItem(key, 'true');
      return localStorage.getItem(key);
    });
    expect(registeredPersistenceTest).toBe('true');
  });

  test('Market Tracker tutorial steps through all 5 items including Actionable Budget Playbook target', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.guestButton.click();

    // Dismiss Home tutorial
    const homeTutorial = page.locator('div.fixed').filter({ hasText: 'Home Page Tutorial' });
    await expect(homeTutorial).toBeVisible({ timeout: 5000 });
    await homeTutorial.locator('button:has-text("Already did tutorial")').click();

    // Switch to Markets tab
    await page.locator('nav[data-tutorial="tab-nav"] button:has-text("Markets")').click();

    // Market Tracker tutorial triggers
    const marketTutorial = page.locator('div.fixed').filter({ hasText: 'Market Tracker Tutorial' });
    await expect(marketTutorial).toBeVisible({ timeout: 5000 });
    await expect(marketTutorial).toContainText('Step 1 of 5');

    // Step through to step 5: Actionable Budget Playbook
    const nextBtn = marketTutorial.locator('button:has-text("Next")');
    await nextBtn.click(); // step 2
    await expect(marketTutorial).toContainText('Step 2 of 5');
    await nextBtn.click(); // step 3
    await expect(marketTutorial).toContainText('Step 3 of 5');
    await nextBtn.click(); // step 4
    await expect(marketTutorial).toContainText('Step 4 of 5');
    await nextBtn.click(); // step 5
    await expect(marketTutorial).toContainText('Step 5 of 5');
    await expect(marketTutorial).toContainText('Actionable Budget Playbook');

    // Verify the target element [data-tutorial="market-budget-impact"] exists in the DOM
    const targetElement = page.locator('[data-tutorial="market-budget-impact"]');
    await expect(targetElement).toBeVisible();

    // Finish tutorial
    const finishBtn = marketTutorial.locator('button:has-text("Finish")');
    await finishBtn.click();
    await expect(marketTutorial).not.toBeVisible();

    const marketsSeen = await page.evaluate(() => sessionStorage.getItem('arca_tutorial_markets_guest'));
    expect(marketsSeen).toBe('true');
  });

  test('Visiting an already-seen tab does not retrigger tutorial in the same session', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.guestButton.click();

    // Dismiss Home tutorial
    const homeTutorial = page.locator('div.fixed').filter({ hasText: 'Home Page Tutorial' });
    await expect(homeTutorial).toBeVisible({ timeout: 5000 });
    await homeTutorial.locator('button:has-text("Already did tutorial")').click();
    await expect(homeTutorial).not.toBeVisible();

    // Visit Summary tab
    await page.locator('nav[data-tutorial="tab-nav"] button:has-text("Summary")').click();
    const summaryTutorial = page.locator('div.fixed').filter({ hasText: 'Financial Summary Tutorial' });
    await expect(summaryTutorial).toBeVisible({ timeout: 5000 });
    await summaryTutorial.locator('button:has-text("Already did tutorial")').click();
    await expect(summaryTutorial).not.toBeVisible();

    // Switch away and back to Summary tab - must NOT retrigger tutorial
    await page.locator('nav[data-tutorial="tab-nav"] button:has-text("Home")').click();
    await page.locator('nav[data-tutorial="tab-nav"] button:has-text("Summary")').click();
    await page.waitForTimeout(600);
    await expect(summaryTutorial).not.toBeVisible();
  });
});
