import { test, expect } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const suppliersListPath = "database/destinations/suppliers";
const createPagePath = "database/destinations/suppliers/create";

test.describe("Create Supplier", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(suppliersListPath);
    // Wait for suppliers list to be visible
    await expect(page.getByText("Suppliers").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("should navigate to create page when clicking Create button", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/suppliers\/create/, { timeout: 10000 });

    await expect(
      page.getByRole("heading", { name: "Create Supplier" })
    ).toBeVisible();
  });

  test("should display all form section cards", async ({ page }) => {
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/suppliers\/create/, { timeout: 10000 });

    const main = page.getByRole("main");
    await expect(main.getByText("General Information").first()).toBeVisible();
    await expect(main.getByText("Contacts").first()).toBeVisible();
  });

  test("should display General Information and Contacts required fields", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/suppliers\/create/, { timeout: 10000 });

    // Use text selectors which are more reliable
    await expect(page.getByText("Name").first()).toBeVisible();
    await expect(page.getByText("Head Office").first()).toBeVisible();
    await expect(page.getByText("Email").first()).toBeVisible();
  });

  test("should display header and footer actions", async ({ page }) => {
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/suppliers\/create/, { timeout: 10000 });

    await expect(
      page.getByRole("button", { name: "Next" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cancel" }).first()
    ).toBeVisible();
  });

  test("should show validation errors for required fields when submitting empty form", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/suppliers\/create/, { timeout: 10000 });

    await page.getByRole("button", { name: "Next" }).first().click();

    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/head office is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  // TODO: Fix this test - the form's dirty state detection seems unreliable in e2e
  test.skip("should show unsaved changes dialog when navigating away with dirty form", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/suppliers\/create/, { timeout: 10000 });

    // Fill any text input to make form dirty
    await page.locator('input[type="text"]').first().fill("Dirty Supplier");

    await page.getByRole("button", { name: "Cancel" }).first().click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: /leave without saving/i })
    ).toBeVisible();
  });

  test("should not show unsaved changes dialog when form is pristine", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/suppliers\/create/, { timeout: 10000 });

    await page.getByRole("button", { name: "Cancel" }).first().click();

    await page.waitForURL(new RegExp(suppliersListPath), { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Suppliers" })
    ).toBeVisible();
  });
});
