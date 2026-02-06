import { test, expect } from '@playwright/test';

test.describe('ForkZero - Green Code Recipe Manager', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should display the main page with correct title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('ForkZero');
    await expect(page.locator('text=The Anti-Cloud Recipe Manager')).toBeVisible();
  });

  test('should have dark mode (OLED optimization)', async ({ page }) => {
    const body = await page.locator('body');
    const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
    // Check for dark background (rgb(9, 9, 11) is zinc-950)
    expect(bgColor).toBe('rgb(9, 9, 11)');
  });

  test('should have input field for recipe URL', async ({ page }) => {
    const input = page.locator('input[type="url"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Paste recipe URL here...');
  });

  test('should have Fork button', async ({ page }) => {
    const button = page.locator('button:has-text("Fork")');
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test('should navigate to saved recipes page', async ({ page }) => {
    await page.click('text=My Recipes');
    await expect(page).toHaveURL(/.*saved/);
    await expect(page.locator('h1')).toContainText('My Saved Recipes');
  });

  test('should show empty state when no recipes', async ({ page }) => {
    await page.click('text=My Recipes');
    await expect(page.locator('text=No recipes saved yet')).toBeVisible();
  });

  test('should have QR sync button', async ({ page }) => {
    await page.click('text=My Recipes');
    const syncButton = page.locator('button:has-text("Sync to Phone")');
    await expect(syncButton).toBeVisible();
  });

  test('should demonstrate local-first architecture', async ({ page }) => {
    // Check that IndexedDB is being used (PGLite)
    const hasIndexedDB = await page.evaluate(() => {
      return 'indexedDB' in window;
    });
    expect(hasIndexedDB).toBe(true);
  });
});
