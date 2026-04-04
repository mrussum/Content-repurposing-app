import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: false,       // sequential — each test mutates shared auth state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: BASE_URL,
    trace:   'on-first-retry',
    // All tests share stored auth state for the relevant fixture user
    // Individual test files override this via `storageState`
  },

  projects: [
    // --- Setup project: logs in and saves auth cookies ---
    {
      name:    'setup-free',
      testMatch: /.*auth\.setup\.ts/,
    },

    // --- Free-user flows ---
    {
      name: 'free-user',
      dependencies: ['setup-free'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/free-user.json',
      },
      testMatch: /.*free-user\.spec\.ts/,
    },

    // --- Pro-user flows ---
    {
      name:    'setup-pro',
      testMatch: /.*auth-pro\.setup\.ts/,
    },
    {
      name: 'pro-user',
      dependencies: ['setup-pro'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/pro-user.json',
      },
      testMatch: /.*pro-user\.spec\.ts/,
    },
  ],

  // Start the Next.js dev server automatically when running E2E tests locally
  webServer: {
    command:            'pnpm dev',
    url:                BASE_URL,
    reuseExistingServer:!process.env.CI,
    timeout:            120_000,
  },
})
