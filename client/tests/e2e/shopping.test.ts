import { expect, test } from '@playwright/test';
import { createListAndShop, openShoppingPage } from './shopping.spec';

test.describe('Shopping Page', () => {
    test('should display shopping page', async ({ page }) => {
        await openShoppingPage(page);
        const header = page.getByText('GrocerEase');
        await expect(header).toBeVisible();
    });

    test('should allow creating and shopping from a list', async ({ page }) => {
        await createListAndShop(page);

        // Verify item is marked as completed (has strikethrough)
        const item = page.getByText('Apples');
        await expect(item).toHaveCSS('text-decoration-line', 'line-through');
    });
});
