import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    // Use HTML reporter but never auto-open / serve the report after tests finish.
    // Serving the HTML report is what prints "Press Ctrl+C to quit" and blocks the process.
    reporter: [['html', { open: 'never' }]],
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
    webServer: {
        // Start the dev server via npm. Playwright will start/stop this process.
        // Use --silent to reduce interactive output and ensure the process stays attached.
        command: 'npm run dev --silent',
        url: 'http://localhost:5173',
        // Always let Playwright manage the server lifecycle so it can shut it down
        // when tests complete. If you want to reuse an already-running server
        // set REUSE_SERVER=true in the environment when invoking Playwright.
        reuseExistingServer: process.env.REUSE_SERVER === 'true' ? true : false,
        timeout: 120_000,
    },
});
