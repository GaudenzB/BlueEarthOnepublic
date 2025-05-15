import { test, expect } from '@playwright/test';

test.describe('Employee Directory', () => {
  // We'll use this to set up authentication before tests
  test.beforeEach(async ({ page }) => {
    // Go to the login page
    await page.goto('/login');
    
    // Log in as a test user
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/password/i).fill('testpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Verify we're logged in by checking for dashboard content
    await expect(page.getByText(/welcome/i)).toBeVisible();
    
    // Navigate to the employee directory
    await page.goto('/employees');
  });

  test('should display employee listing', async ({ page }) => {
    // Check that we have the employee directory page
    await expect(page.getByRole('heading', { name: /employee directory/i })).toBeVisible();
    
    // Check that we have employee cards
    await expect(page.locator('.employee-card')).toHaveCount({ min: 1 });
  });

  test('should be able to filter employees', async ({ page }) => {
    // Check that we have the filter UI
    await expect(page.getByLabel(/search/i)).toBeVisible();
    
    // Search for a specific department
    await page.getByLabel(/search/i).fill('finance');
    
    // Wait for the filtered results
    await page.waitForTimeout(500);
    
    // Check that the results contain finance department employees
    const employeeCards = page.locator('.employee-card');
    await expect(employeeCards).toHaveCount({ min: 1 });
    
    // Check at least one employee has finance in their info
    const hasFinance = await page.locator('.employee-card').filter({ hasText: /finance/i }).count() > 0;
    expect(hasFinance).toBeTruthy();
  });

  test('should be able to view employee details', async ({ page }) => {
    // Click on the first employee card
    await page.locator('.employee-card').first().click();
    
    // Check that we navigated to the employee detail page
    await expect(page).toHaveURL(/\/employees\/\d+/);
    
    // Check for detailed employee information
    await expect(page.getByText(/contact information/i)).toBeVisible();
    await expect(page.getByText(/role/i)).toBeVisible();
  });
});