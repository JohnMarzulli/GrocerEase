import { expect, test } from '@playwright/test';

test.describe('Home Page', () => {
    test('should display home page title', async ({ page }) => {
        await page.goto('/');
        const header = page.getByText('GrocerEase');
        await expect(header).toBeVisible();
    });

    test('should navigate to shop page', async ({ page }) => {
        await page.goto('/');
        await page.click('button:has-text("Shop")');
        await expect(page).toHaveURL('/shopping-selector');
    });

    test('should navigate to edit page', async ({ page }) => {
        await page.goto('/');
        await page.click('button:has-text("Edit")');
        await expect(page).toHaveURL('/lists');
    });
});
