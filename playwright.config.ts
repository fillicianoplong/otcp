import { defineConfig, devices } from '@playwright/test';

const host = '127.0.0.1';
const port = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://${host}:${port}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run build && npm run preview -- --host ${host} --port ${port} --strictPort`,
    url: `http://${host}:${port}/otcp/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
