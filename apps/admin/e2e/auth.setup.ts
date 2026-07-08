import { test as setup, expect } from "@playwright/test";

// Path relative to project root (apps/admin) - matches storageState in playwright.config.ts
const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // MSW is enabled for e2e tests - it automatically returns authenticated user
  // from /api/auth/me handler. We need to wait for MSW service worker to register.

  // First load - triggers MSW service worker registration
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Reload to ensure MSW service worker is fully active and intercepting requests
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Verify we're authenticated by checking we're NOT on the login page
  // If authenticated, we should see the main app (sidebar with navigation)
  await expect(page.getByRole("button", { name: /login/i })).not.toBeVisible({
    timeout: 10000,
  });

  await page.context().storageState({ path: authFile });
});
