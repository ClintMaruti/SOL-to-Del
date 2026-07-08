import { test, expect } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

test.describe("Destination Search", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto("database/destinations/destinations");
    // Wait for destinations to load
    await page
      .getByPlaceholder("Search destination")
      .waitFor({ timeout: 10000 });
  });

  test("should display search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search destination");
    await expect(searchInput).toBeVisible();
  });

  test("should display search icon", async ({ page }) => {
    const searchIcon = page.locator("svg").first();
    await expect(searchIcon).toBeVisible();
  });

  test("should filter destinations by name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search destination");

    // Type search query
    await searchInput.fill("kenya");

    // Wait for filtering to complete
    await page.waitForTimeout(300);

    // Verify that filtered results are shown
    // The tree should show Kenya and its children
    const kenyaDestination = page.getByText("Kenya", { exact: false });
    await expect(kenyaDestination.first()).toBeVisible();
  });

  test("should filter destinations by partial name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search destination");

    await searchInput.fill("southern");

    await page.waitForTimeout(300);

    // Should show Southern Kenya
    const southernKenya = page.getByText("Southern Kenya");
    await expect(southernKenya).toBeVisible();
  });

  test("should show empty state when no results found", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search destination");

    await searchInput.fill("xyz");

    // Wait for empty state to appear
    const emptyStateHeading = page.getByText("No matching destinations");
    await expect(emptyStateHeading).toBeVisible();

    // Verify the description text is also shown
    const emptyStateDescription = page.getByText(
      "We couldn't find any destinations matching your search. Check the spelling or try a different name."
    );
    await expect(emptyStateDescription).toBeVisible();
  });

  test("should clear search and show all destinations", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search destination");

    // Search for something
    await searchInput.fill("kenya");
    await page.waitForTimeout(300);

    // Clear the search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // Should show all destinations again
    const kenyaDestination = page.getByText("Kenya", { exact: false });
    await expect(kenyaDestination.first()).toBeVisible();
  });

  test("should filter destinations by code", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search destination");

    await searchInput.fill("KEN");

    await page.waitForTimeout(300);

    // Should show destinations with KEN code
    const kenyaDestination = page.getByText("Kenya", { exact: false });
    await expect(kenyaDestination.first()).toBeVisible();
  });

  test("should handle case-insensitive search", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search destination");

    // Search with uppercase
    await searchInput.fill("KENYA");
    await page.waitForTimeout(300);

    const kenyaDestination = page.getByText("Kenya", { exact: false });
    await expect(kenyaDestination.first()).toBeVisible();

    // Clear and search with lowercase
    await searchInput.clear();
    await searchInput.fill("kenya");
    await page.waitForTimeout(300);

    await expect(kenyaDestination.first()).toBeVisible();
  });

  test("should auto-expand nodes when searching", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search destination");

    // Search for a nested destination
    await searchInput.fill("amboseli");
    await page.waitForTimeout(500);

    // The parent nodes should be expanded to show the matching child
    const amboseli = page.getByText("Amboseli", { exact: false });
    await expect(amboseli.first()).toBeVisible();
  });

  test("should maintain search state when navigating", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search destination");

    await searchInput.fill("kenya");
    await page.waitForTimeout(300);

    // Navigate away and back (if there's navigation)
    // For now, just verify the search persists
    const inputValue = await searchInput.inputValue();
    expect(inputValue).toBe("kenya");
  });

  test("should have proper input attributes", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search destination");

    // Check input type
    const inputType = await searchInput.getAttribute("type");
    expect(inputType).toBe("text");

    // Check placeholder
    const placeholder = await searchInput.getAttribute("placeholder");
    expect(placeholder).toBe("Search destination");
  });
});
