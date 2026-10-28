import { defineConfig, devices } from '@playwright/test';

const host = '127.0.0.1';
const port = 4174;

export default defineConfig({
  testDir: '.',
  testMatch: 'bench.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 600_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://${host}:${port}`,
  },
  webServer: {
    command: 'node serve.mjs',
    url: `http://${host}:${port}/bench.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Pixel 5'],
        launchOptions: {
          args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'],
        },
      },
    },
  ],
});
