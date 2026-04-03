import { defineConfig, devices } from '@playwright/test';

const host = '127.0.0.1';
const port = 4173;
const baseURL = process.env.BASE_URL ?? `http://${host}:${port}`;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  ...(process.env.BASE_URL
    ? {}
    : {
        webServer: {
          command: `VITE_CATALOG_GRID_PAGE_SIZE=1 npm run build && npm run preview -- --host ${host} --port ${port} --strictPort`,
          url: `http://${host}:${port}/otcp/`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
