// Helper utilities for shopping page interactions — keep this file free of top-level test() calls
// so it can be safely imported by other modules (move actual Playwright test(...) calls to a separate test file).

export async function openShoppingPage(page: any) {
    await page.goto('/shopping-selector');
    const header = page.getByText('GrocerEase');
    await header.waitFor({ state: 'visible' });
}

export async function createListAndShop(page: any) {
    // Create a list first
    await page.goto('/lists');
    await page.click('button:has-text("Create New List")');

    // Add an item
    const input = page.locator('input[placeholder="New Item Name"]');
    await input.fill('Apples');
    await page.click('button:has-text("Add")');

    // Go to shopping
    await page.click(`a:has-text("Shop")`);

    // Verify we can see the item
    const item = page.getByText('Apples');
    await item.waitFor({ state: 'visible' });

    // Check the item
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();

    // Note: leave assertions (expect) to the caller test file so this module is safe to import.
}
