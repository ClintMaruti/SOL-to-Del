import { test, expect } from "@playwright/test";
import { setupDesktopViewport } from "../fixtures/test-setup";

test.describe("Admin App", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
  });

  test("should load the app", async ({ page }) => {
    // Navigate to the app (will redirect to destinations)
    await page.goto("./");

    // Check that the page title is correct
    await expect(page).toHaveTitle(/admin/i);

    // Check that the root element exists
    const root = page.locator("#root");
    await expect(root).toBeVisible();

    // Wait for navigation to complete (app redirects to /database/destinations/destinations)
    await page.waitForURL("**/database/destinations/destinations");

    // Check that the Destinations page heading is visible
    const heading = page.getByRole("heading", { name: /destinations/i });
    await expect(heading).toBeVisible();
  });

  test("should display the create destination button", async ({ page }) => {
    // Navigate to destinations page
    await page.goto("database/destinations/destinations");

    // Check that the Create Destination button is visible
    const button = page.getByRole("button", { name: /create destination/i });
    await expect(button).toBeVisible();
  });
});
