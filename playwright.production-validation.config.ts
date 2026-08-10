import { defineConfig, devices } from '@playwright/test';

const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'production-validation.spec.ts',
  workers: 1,
  webServer: [
    {
      command: 'pnpm run server',
      url: 'http://127.0.0.1:3000/api/v1/bootstrap',
      reuseExistingServer: false,
      timeout: 120_000,
      env: { TRANSIT_RUNTIME_MODE: 'validation', TRANSIT_DATA_DIRECTORY: '.data' },
    },
    {
      command: 'pnpm exec vite --config vite.config.ts --host 127.0.0.1 --port 4174 --strictPort',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: systemChromium ? { executablePath: systemChromium } : undefined,
      },
    },
  ],
});
