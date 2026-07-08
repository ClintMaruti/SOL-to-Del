import { test, expect, type Page } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const SUPPLIERS_LIST_PATH = "database/destinations/suppliers";

/**
 * Opens the first supplier from the suppliers list table (view/edit).
 */
async function openFirstSupplierFromList(page: Page) {
  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toBeVisible({ timeout: 10000 });
  const nameButton = firstRow.getByRole("button").first();
  const supplierName = await nameButton.textContent();
  await nameButton.click();
  await page.waitForURL(new RegExp(`suppliers/[^/]+$`), { timeout: 10000 });
  return (supplierName ?? "").trim();
}

test.describe("Edit Supplier", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(SUPPLIERS_LIST_PATH);
    // Wait for suppliers list to load
    await expect(page.getByText("Suppliers").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("should open supplier detail page", async ({ page }) => {
    const supplierName = await openFirstSupplierFromList(page);

    // Wait for supplier detail to load - check for the heading with supplier name
    await expect(page.getByRole("heading", { name: supplierName })).toBeVisible(
      { timeout: 15000 }
    );
  });

  test("should display General Information section", async ({ page }) => {
    await openFirstSupplierFromList(page);

    // Wait for General Information heading
    await expect(page.getByText("General Information").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("should display Name form field", async ({ page }) => {
    await openFirstSupplierFromList(page);

    // Wait for the Name label or input to appear
    await expect(page.getByText("Name").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
