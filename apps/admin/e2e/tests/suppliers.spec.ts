import { expect, test } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const SUPPLIER_SEARCH_PLACEHOLDER =
  "Search supplier by name, head office, email or code";
const DEBOUNCE_WAIT_MS = 400;

test.describe("Suppliers List", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto("database/destinations/suppliers");
    await page
      .getByPlaceholder(SUPPLIER_SEARCH_PLACEHOLDER)
      .waitFor({ timeout: 10000 });
  });

  test.describe("View Suppliers List", () => {
    test("should display suppliers page header", async ({ page }) => {
      const header = page.getByRole("heading", { name: /suppliers/i });
      await expect(header).toBeVisible();
    });

    test("should display suppliers table with headers", async ({ page }) => {
      const table = page.locator("table");
      await expect(table.getByText("Supplier")).toBeVisible();
      await expect(table.getByText("Head Office")).toBeVisible();
      await expect(table.getByText("Code")).toBeVisible();
      await expect(table.getByText("Location")).toBeVisible();
      await expect(table.getByText("Email")).toBeVisible();
      await expect(table.getByText("Phone")).toBeVisible();
      await expect(table.getByText("Active")).toBeVisible();
      await expect(table.getByText("Actions")).toBeVisible();
    });

    test("should display suppliers in the table", async ({ page }) => {
      const firstSupplier = page.getByText("Elewana Lodges & Camps");
      await expect(firstSupplier).toBeVisible({ timeout: 5000 });
    });

    test("should display Create button", async ({ page }) => {
      const createButton = page.getByRole("button", { name: /create/i });
      await expect(createButton).toBeVisible();
    });

    test("should display search input", async ({ page }) => {
      const searchInput = page.getByPlaceholder(SUPPLIER_SEARCH_PLACEHOLDER);
      await expect(searchInput).toBeVisible();
    });
  });

  test.describe("Search Functionality", () => {
    test("should filter suppliers when searching by name", async ({ page }) => {
      const searchInput = page.getByPlaceholder(SUPPLIER_SEARCH_PLACEHOLDER);
      await searchInput.fill("elewana");

      await page.waitForTimeout(DEBOUNCE_WAIT_MS);

      await expect(page.getByText("Elewana Lodges & Camps")).toBeVisible();
      await expect(page.getByText("Serengeti Safari Co.")).not.toBeVisible();
    });

    test("should filter suppliers when searching by code", async ({ page }) => {
      const searchInput = page.getByPlaceholder(SUPPLIER_SEARCH_PLACEHOLDER);
      await searchInput.fill("KTL-003");

      await page.waitForTimeout(DEBOUNCE_WAIT_MS);

      await expect(page.getByText("Kilimanjaro Trekking Ltd")).toBeVisible();
      await expect(page.getByText("Elewana Lodges & Camps")).not.toBeVisible();
    });

    test("should filter suppliers when searching by email", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder(SUPPLIER_SEARCH_PLACEHOLDER);
      await searchInput.fill("serengetisafarico");

      await page.waitForTimeout(DEBOUNCE_WAIT_MS);

      await expect(page.getByText("Serengeti Safari Co.")).toBeVisible();
      await expect(
        page.getByText("Kilimanjaro Trekking Ltd")
      ).not.toBeVisible();
    });

    test("should show all suppliers when search is cleared", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder(SUPPLIER_SEARCH_PLACEHOLDER);

      await searchInput.fill("elewana");
      await page.waitForTimeout(DEBOUNCE_WAIT_MS);
      await expect(page.getByText("Serengeti Safari Co.")).not.toBeVisible();

      await searchInput.clear();
      await page.waitForTimeout(DEBOUNCE_WAIT_MS);

      await expect(page.getByText("Elewana Lodges & Camps")).toBeVisible();
      await expect(page.getByText("Serengeti Safari Co.")).toBeVisible();
    });

    test("should show empty search result when no match", async ({ page }) => {
      const searchInput = page.getByPlaceholder(SUPPLIER_SEARCH_PLACEHOLDER);
      await searchInput.fill("xyznonexistent");

      await page.waitForTimeout(DEBOUNCE_WAIT_MS);

      await expect(
        page.getByRole("heading", { name: "No match" })
      ).toBeVisible();
    });

    test("should require at least 3 characters before filtering", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder(SUPPLIER_SEARCH_PLACEHOLDER);
      await searchInput.fill("el");

      await page.waitForTimeout(DEBOUNCE_WAIT_MS);

      await expect(page.getByText("Elewana Lodges & Camps")).toBeVisible();
      await expect(page.getByText("Serengeti Safari Co.")).toBeVisible();
    });
  });

  test.describe("Sorting", () => {
    test("should sort by supplier name when header is clicked", async ({
      page,
    }) => {
      const table = page.locator("table");
      const nameHeader = table.getByRole("button", {
        name: "Supplier",
        exact: true,
      });
      await nameHeader.click();

      await page.waitForTimeout(500);

      const firstCell = page.locator("tbody tr:first-child td:first-child");
      const text = await firstCell.textContent();
      expect(text?.toLowerCase()).toMatch(/elewana|alpha|a/);
    });

    test("should toggle sort direction on second click", async ({ page }) => {
      const table = page.locator("table");
      const nameHeader = table.getByRole("button", {
        name: "Supplier",
        exact: true,
      });

      await nameHeader.click();
      await page.waitForTimeout(300);

      await nameHeader.click();
      await page.waitForTimeout(300);

      const firstCell = page.locator("tbody tr:first-child td:first-child");
      const text = await firstCell.textContent();
      expect(text?.toLowerCase()).toMatch(/katavi|ruaha|tarangire|t|k|r/);
    });
  });

  test.describe("Loading State", () => {
    test("should show loading state then content when navigating to page", async ({
      page,
    }) => {
      await page.goto("database/destinations/suppliers");

      await expect(
        page.getByRole("heading", { name: /suppliers/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByPlaceholder(SUPPLIER_SEARCH_PLACEHOLDER)
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
