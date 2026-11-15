export class AuthPage {
  constructor(page) {
    this.page = page;
    this.signInToggle = page.locator('button:has-text("Sign In")').first();
    this.createAccountToggle = page.locator('button:has-text("Create Account")').first();
    this.nameInput = page.locator('input[name="name"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.passwordToggle = page.locator('button[aria-label="Hide password"], button[aria-label="Show password"]');
    this.forgotPasswordLink = page.locator('button:has-text("Forgot password?")');
    this.submitButton = page.locator('form button[type="submit"]');
    this.googleButton = page.locator('button:has-text("Continue with Google")');
    this.guestButton = page.locator('button:has-text("Skip sign in & launch Tutorial as Guest")');

    // Reset Modal
    this.resetModal = page.locator('div.fixed.inset-0').filter({ hasText: 'Reset Password' });
    this.resetEmailInput = this.resetModal.locator('input[type="email"]');
    this.resetSubmitButton = this.resetModal.locator('button[type="submit"]');
    this.resetCancelButton = this.resetModal.locator('button:has-text("Cancel")');
  }

  async loginAsGuest(dismissTutorial = true) {
    await this.guestButton.click();
    if (dismissTutorial) {
      try {
        const skip = this.page.locator('button:has-text("Already did tutorial")');
        await skip.waitFor({ state: 'visible', timeout: 3000 });
        await skip.click();
        await skip.waitFor({ state: 'hidden', timeout: 3000 });
      } catch {
        // Overlay already dismissed or didn't show
      }
    }
    await this.page.evaluate(() => {
      ['home', 'assistant', 'markets', 'summary', 'transactions'].forEach(tab => {
        sessionStorage.setItem(`arca_tutorial_${tab}_guest`, 'true');
        localStorage.setItem(`arca_tutorial_${tab}_guest`, 'true');
      });
    });
  }

  async togglePasswordVisibility() {
    await this.passwordToggle.click();
  }

  async openForgotPassword() {
    await this.forgotPasswordLink.click();
  }
}
