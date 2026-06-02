import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for RealtimeBoard.
 *
 * - Tests in `e2e/` only.
 * - Auto-starts `npm start` (Angular dev server) and waits for http://localhost:4200.
 * - `test:add` & `test:dnd` need only a running dev server (Firebase calls will
 *   queue but the local optimistic UI handles them). `test:sync` exercises real
 *   cross-context sync and requires a real Firebase project in environment.ts.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env['PLAYWRIGHT_BASE_URL']
    ? undefined
    : {
        command: 'npm start -- --port=4200',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
