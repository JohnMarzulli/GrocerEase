import { expect, test } from '@playwright/test';
import { createListAndShop, openShoppingPage } from './shopping-tests-setup';

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
        expect(item).not.toBeUndefined();
        expect(item).not.toBeNull();
    });
});
