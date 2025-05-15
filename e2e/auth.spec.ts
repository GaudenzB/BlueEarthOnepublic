import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in the login form with invalid credentials
    await page.getByLabel(/username/i).fill('invalid-user');
    await page.getByLabel(/password/i).fill('invalid-password');
    
    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check for error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // This test will use test credentials set up in the test environment
    await page.goto('/login');
    
    // Fill in the login form with valid test credentials
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/password/i).fill('testpassword');
    
    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check that we're redirected to the dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});