import { test, expect, type Page } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const SUPPLIERS_LIST_PATH = "database/destinations/suppliers";

/**
 * Opens the first supplier from the list and navigates to the Contracts tab.
 */
async function openFirstSupplierAndGoToContractsTab(page: Page) {
  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toBeVisible({ timeout: 10000 });
  const nameButton = firstRow.getByRole("button").first();
  await nameButton.click();
  await page.waitForURL(new RegExp(`suppliers/[^/]+$`), { timeout: 10000 });

  await page.getByRole("tab", { name: /contracts/i }).click();
  await expect(page.getByText("Contract Name").first()).toBeVisible({
    timeout: 10000,
  });
}

test.describe("Supplier Contracts", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(SUPPLIERS_LIST_PATH);
    await expect(page.getByText("Suppliers").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test.describe("Contracts tab – list and headers", () => {
    test("should display Contracts section with table headers", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToContractsTab(page);

      await expect(page.getByRole("heading", { name: "Contract" })).toBeVisible(
        { timeout: 10000 }
      );
      await expect(page.getByText("Contract Name").first()).toBeVisible();
      await expect(page.getByText("Link").first()).toBeVisible();
      await expect(page.getByText("Valid From").first()).toBeVisible();
      await expect(page.getByText("Valid To").first()).toBeVisible();
      await expect(page.getByText("Status").first()).toBeVisible();
    });

    test("should display contract rows for supplier", async ({ page }) => {
      await openFirstSupplierAndGoToContractsTab(page);

      await expect(
        page.getByRole("button", { name: /Elewana Contract 2025/i })
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Activate flow – confirm dialog", () => {
    test("should open confirm dialog when clicking status switch on inactive contract", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToContractsTab(page);

      const inactiveContractRow = page
        .locator("tbody tr")
        .filter({ hasText: "Elewana Legacy Contract" });
      await expect(inactiveContractRow).toBeVisible({ timeout: 10000 });
      const switchInRow = inactiveContractRow.getByRole("switch");
      await switchInRow.click();

      await expect(
        page.getByRole("heading", { name: /activate contract\?/i })
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(/once activated.*cannot be deactivated/i)
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /activate/i })
      ).toBeVisible();
    });

    test("should show Cancel and Activate buttons in confirm dialog", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToContractsTab(page);

      const inactiveContractRow = page
        .locator("tbody tr")
        .filter({ hasText: "Elewana Legacy Contract" });
      await expect(inactiveContractRow).toBeVisible({ timeout: 10000 });
      await inactiveContractRow.getByRole("switch").click();

      await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /activate/i })
      ).toBeVisible();
    });
  });

  test.describe("Activate flow – cancel path", () => {
    test("should close confirm dialog when Cancel is clicked", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToContractsTab(page);

      const inactiveContractRow = page
        .locator("tbody tr")
        .filter({ hasText: "Elewana Legacy Contract" });
      await expect(inactiveContractRow).toBeVisible({ timeout: 10000 });
      await inactiveContractRow.getByRole("switch").click();

      await expect(
        page.getByRole("heading", { name: /activate contract\?/i })
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: /cancel/i }).click();

      await expect(
        page.getByRole("heading", { name: /activate contract\?/i })
      ).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Activate flow – confirm path and outcome", () => {
    test("should activate contract when Activate is confirmed and show success toast", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToContractsTab(page);

      const inactiveContractRow = page
        .locator("tbody tr")
        .filter({ hasText: "Elewana Legacy Contract" });
      await expect(inactiveContractRow).toBeVisible({ timeout: 10000 });
      await inactiveContractRow.getByRole("switch").click();

      await expect(
        page.getByRole("heading", { name: /activate contract\?/i })
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: /activate/i }).click();

      await expect(
        page.getByRole("heading", { name: /activate contract\?/i })
      ).not.toBeVisible({ timeout: 10000 });

      await expect(
        page.getByText("Contract activated successfully.")
      ).toBeVisible({ timeout: 5000 });

      const rowAfterActivation = page
        .locator("tbody tr")
        .filter({ hasText: "Elewana Legacy Contract" });
      const switchAfter = rowAfterActivation.getByRole("switch");
      await expect(switchAfter).toBeDisabled();
    });
  });
});
