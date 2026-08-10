import { defineConfig, devices } from '@playwright/test';

const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: 'production-validation.spec.ts',
  workers: 1,
  webServer: {
    command: 'node node_modules/tsx/dist/cli.mjs tests/e2e/fixture-server.ts',
    url: 'http://127.0.0.1:4173/__test/health',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
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
