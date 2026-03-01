import { expect, test } from '@playwright/test';

test.describe('List Editor', () => {
    test('should navigate to list editor from home', async ({ page }) => {
        await page.goto('/');
        await page.click('button:has-text("Edit")');
        await expect(page).toHaveURL('/lists');
    });

    test('should create a new list', async ({ page }) => {
        await page.goto('/lists');
        await page.click('button:has-text("Create New List")');
        await page.click('button:has-text("Local")');
        // The URL should contain an id parameter
        await expect(page).toHaveURL(/\/edit\?id=[\w-]+/);
    });

    test('should allow creating a public list', async ({ page }) => {
        await page.goto('/lists');
        await page.click('button:has-text("Create New List")');
        await page.click('button:has-text("Public")');
        await expect(page).toHaveURL(/\/edit\?id=[\w-]+/);
    });

    test('should add an item to the list', async ({ page }) => {
        await page.goto('/lists');
        await page.click('button:has-text("Create New List")');
        await page.click('button:has-text("Local")');

        // Fill in the item input and add
        const input = page.locator('input[placeholder="New Item Name"]');
        await input.fill('Milk');
        await page.click('button:has-text("Add")');

        // Verify item appears in list
        const item = page.getByText('Milk');
        await expect(item).toBeVisible();
    });

    test('should add an item to a public list (server-backed)', async ({ page }) => {
        await page.goto('/lists');
        await page.click('button:has-text("Create New List")');
        await page.click('button:has-text("Public")');

        const input = page.locator('input[placeholder="New Item Name"]');
        await input.fill('Eggs');
        await page.click('button:has-text("Add")');

        // verify the server-supplied item appears
        const item = page.getByText('Eggs');
        await expect(item).toBeVisible();
    });
});
