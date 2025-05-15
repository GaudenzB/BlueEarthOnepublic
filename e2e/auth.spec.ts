import { test, expect } from '@playwright/test';

test.describe('Authentication tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Verify the form elements are present
    await expect(page.locator('h1:has-text("Sign in")')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill in the login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password123');
    
    // Click the login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete and check redirect
    await page.waitForURL('**/dashboard');
    
    // Verify the user is logged in
    const userDropdown = page.locator('button:has-text("Admin")');
    await expect(userDropdown).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill in the login form with invalid credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Click the login button
    await page.click('button[type="submit"]');
    
    // Check for error message
    const errorMessage = page.locator('div[role="alert"]:has-text("Invalid username or password")');
    await expect(errorMessage).toBeVisible();
    
    // Verify we're still on the login page
    await expect(page.url()).toContain('/login');
  });

  test('should navigate to SSO login when clicking SSO button', async ({ page }) => {
    // Check if SSO button exists
    const ssoButton = page.locator('button:has-text("Sign in with Microsoft")');
    
    if (await ssoButton.isVisible()) {
      // Click the SSO button
      await ssoButton.click();
      
      // This would normally redirect to Microsoft login page
      // For testing, we just verify it tries to navigate to the right route
      await expect(page.url()).toContain('/api/auth/sso');
    } else {
      // If SSO is not configured, this test is skipped
      test.skip(true, 'SSO button not available');
    }
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('**/dashboard');
    
    // Click the user dropdown
    await page.click('button:has-text("Admin")');
    
    // Click logout
    await page.click('button:has-text("Logout")');
    
    // Verify we're redirected to login page
    await expect(page.url()).toContain('/login');
    
    // Verify login form is visible again
    await expect(page.locator('h1:has-text("Sign in")')).toBeVisible();
  });
});