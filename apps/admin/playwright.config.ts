import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 * In CI, use localhost (chelipeacock.dev.localhost does not resolve in runners).
 */
const isCI = !!process.env.CI;
const adminBaseUrl = isCI
  ? "http://localhost:7375/admin/"
  : "http://chelipeacock.dev.localhost:7375/admin/";

export default defineConfig({
  testDir: "./e2e/tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: isCI,
  /* Retry on CI only */
  retries: isCI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: isCI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: adminBaseUrl,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project - authenticates and saves state
    {
      name: "setup",
      testDir: "./e2e",
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  /* Run your local dev server before starting the tests. Set PW_SKIP_WEB_SERVER=1 to use an already-running server. */
  ...(process.env.PW_SKIP_WEB_SERVER
    ? {}
    : {
        webServer: {
          command: "VITE_USE_MSW=true pnpm dev",
          url: adminBaseUrl,
          // Always start fresh server to ensure MSW is enabled
          // Use PW_SKIP_WEB_SERVER=1 to use an existing server manually
          reuseExistingServer: false,
          timeout: 120 * 1000,
        },
      }),
});
