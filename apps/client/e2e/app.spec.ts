import { test, expect } from "@playwright/test";

test.describe("Client App", () => {
  test("should load the app", async ({ page }) => {
    await page.goto("/");

    // Check that the page title is correct
    await expect(page).toHaveTitle(/client/i);

    // Check that the root element exists
    const root = page.locator("#root");
    await expect(root).toBeVisible();

    // Check that the main heading is visible
    const heading = page.getByRole("heading", { name: /client/i });
    await expect(heading).toBeVisible();
  });

  test("should display the test button", async ({ page }) => {
    await page.goto("/");

    // Check that the button is visible
    const button = page.getByRole("button", { name: /client test button/i });
    await expect(button).toBeVisible();
  });
});
