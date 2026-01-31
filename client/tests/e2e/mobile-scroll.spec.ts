import { test, expect } from '@playwright/test';

// Emulate a mobile viewport with touch support
test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

test.describe('Mobile scrolling', () => {
    test('should allow touch scrolling from the middle of the list on mobile', async ({ page }) => {
        // Create a list with many items so the page is scrollable
        await page.goto('/lists');
        await page.click('button:has-text("Create New List")');

        const input = page.locator('input[placeholder="New Item Name"]');
        for (let i = 0; i < 20; i++) {
            await input.fill(`Item ${i}`);
            await page.click('button:has-text("Add")');
        }

        // Go to shopping
        await page.click('a:has-text("Shop")');

        const content = page.locator('.content');

        // Sanity: ensure content is visible and larger than the viewport
        await expect(content).toBeVisible();

        const initialScroll = await content.evaluate((el) => (el as HTMLElement).scrollTop);

        // Perform a vertical swipe starting from the center area of the content
        const box = await content.boundingBox();
        if (!box) throw new Error('Unable to get .content bounding box for swipe');

        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        const endY = startY - 300; // swipe up

        // Use mouse drag to simulate touch swipe (hasTouch:true helps map events)
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX, endY, { steps: 12 });
        await page.mouse.up();

        // Wait a short moment for scroll inertia
        await page.waitForTimeout(250);

        const afterScroll = await content.evaluate((el) => (el as HTMLElement).scrollTop);

        expect(afterScroll).toBeGreaterThan(initialScroll);
    });
});
