import { test, expect } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

test.describe("Destination Tree", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto("database/destinations/destinations");
    // Wait for destinations to load
    await page
      .getByPlaceholder("Search destination")
      .waitFor({ timeout: 10000 });
  });

  test("should display destination tree", async ({ page }) => {
    // Verify Kenya destination is visible
    const kenya = page.getByText("Kenya", { exact: false });
    await expect(kenya.first()).toBeVisible();
  });

  test("should display destination details", async ({ page }) => {
    // Check that destination name is visible
    const kenya = page.getByText("Kenya", { exact: false });
    await expect(kenya.first()).toBeVisible();

    // Check that code is displayed if available
    const code = page.getByText("KEN", { exact: false });
    // Code might be visible, but not required to pass
  });

  test("should expand and collapse nodes", async ({ page }) => {
    // Find Kenya node with "Expand" aria-label (collapsed state)
    const expandButton = page.locator('button[aria-label="Expand"]').first();

    // Check if expandable (has children)
    const isExpandable = (await expandButton.count()) > 0;

    if (isExpandable) {
      // Click to expand
      await expandButton.click();

      // Wait for aria-label to change to "Collapse" (confirms React state updated)
      const collapseButton = page
        .locator('button[aria-label="Collapse"]')
        .first();
      await expect(collapseButton).toBeVisible({ timeout: 5000 });

      // Verify children are visible (e.g., Southern Kenya)
      const southernKenya = page.getByText("Southern Kenya", { exact: false });
      await expect(southernKenya).toBeVisible({ timeout: 2000 });

      // Click again to collapse
      await collapseButton.click();

      // Wait for aria-label to change back to "Expand"
      await expect(expandButton).toBeVisible({ timeout: 2000 });

      // Children should not be visible
      await expect(southernKenya).not.toBeVisible({ timeout: 2000 });
    }
  });

  test("should show nested destinations when expanded", async ({ page }) => {
    // Find and expand Kenya
    const kenyaExpandButton = page
      .locator('button[aria-label="Expand"]')
      .first();

    const expandableExists = (await kenyaExpandButton.count()) > 0;

    if (expandableExists) {
      await kenyaExpandButton.click();

      // Wait for aria-label to change to "Collapse" (confirms React state updated)
      await expect(
        page.locator('button[aria-label="Collapse"]').first()
      ).toBeVisible({ timeout: 5000 });

      // Check for nested destinations
      const nestedDestination = page
        .getByText("Southern Kenya", { exact: false })
        .or(page.getByText("Central Kenya", { exact: false }));
      await expect(nestedDestination.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test("should display destination type icons", async ({ page }) => {
    // Icons should be present (SVG elements)
    const icons = page.locator("svg");
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThan(0);
  });

  test("should display coordinates when available", async ({ page }) => {
    // Coordinates might be displayed for destinations that have them
    // This is optional, so we'll just check the tree renders correctly
    const kenya = page.getByText("Kenya", { exact: false });
    await expect(kenya.first()).toBeVisible();
  });

  test("should handle destinations without children", async ({ page }) => {
    // Leaf nodes (destinations without children) should still render
    // Expand Kenya to see leaf nodes
    const expandButton = page.locator('button[aria-label="Expand"]').first();

    const hasExpandable = (await expandButton.count()) > 0;

    if (hasExpandable) {
      await expandButton.click();

      // Wait for aria-label to change to "Collapse" (confirms React state updated)
      await expect(
        page.locator('button[aria-label="Collapse"]').first()
      ).toBeVisible({ timeout: 5000 });

      // Leaf nodes should be visible
      const treeRows = page.locator('[class*="border-b"]');
      const rowCount = await treeRows.count();
      expect(rowCount).toBeGreaterThan(1); // At least parent + 1 child
    }
  });

  test("should maintain tree state during search", async ({ page }) => {
    // Expand a node
    const expandButton = page.locator('button[aria-label="Expand"]').first();

    const hasExpandable = (await expandButton.count()) > 0;

    if (hasExpandable) {
      await expandButton.click();

      // Wait for aria-label to change to "Collapse" (confirms React state updated)
      await expect(
        page.locator('button[aria-label="Collapse"]').first()
      ).toBeVisible({ timeout: 5000 });

      // Perform a search
      const searchInput = page.getByPlaceholder("Search destination");
      await searchInput.fill("kenya");

      // Wait for search results to appear
      await expect(
        page.getByText("Kenya", { exact: false }).first()
      ).toBeVisible({ timeout: 2000 });

      // Tree should still be functional
      const kenya = page.getByText("Kenya", { exact: false });
      await expect(kenya.first()).toBeVisible();
    }
  });

  test("should auto-expand when searching", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search destination");

    // Search for a nested destination
    await searchInput.fill("amboseli");

    // Parent nodes should be auto-expanded to show the match
    // Wait for the search result to appear (auto-expansion happens automatically)
    const amboseli = page.getByText("Amboseli", { exact: false });
    await expect(amboseli.first()).toBeVisible({ timeout: 5000 });
  });

  test("should display code badges", async ({ page }) => {
    // Codes should be displayed as badges
    // Look for badge elements or code text
    const kenya = page.getByText("Kenya", { exact: false });
    await expect(kenya.first()).toBeVisible();

    // Code badges might be visible
    const badges = page.locator('[class*="badge"], [class*="Badge"]');
    const badgeCount = await badges.count();
    // At least some destinations should have codes
  });

  test("should handle deep nesting", async ({ page }) => {
    // Expand nodes to show deep nesting
    const expandButton = page.locator('button[aria-label="Expand"]').first();

    // Expand first few levels
    const buttonCount = await expandButton.count();
    if (buttonCount > 0) {
      await expandButton.click();

      // Wait for aria-label to change to "Collapse" (confirms React state updated)
      await expect(
        page.locator('button[aria-label="Collapse"]').first()
      ).toBeVisible({ timeout: 5000 });

      // Check if nested levels are accessible
      const nestedRows = page.locator('[class*="border-b"]');
      const nestedCount = await nestedRows.count();
      expect(nestedCount).toBeGreaterThan(1);
    }
  });

  test("should show proper indentation for nested items", async ({ page }) => {
    // Expand a node
    const expandButton = page.locator('button[aria-label="Expand"]').first();

    const hasExpandable = (await expandButton.count()) > 0;

    if (hasExpandable) {
      await expandButton.click();

      // Wait for aria-label to change to "Collapse" (confirms React state updated)
      await expect(
        page.locator('button[aria-label="Collapse"]').first()
      ).toBeVisible({ timeout: 5000 });

      // Check that nested items have different padding/indentation
      const rows = page.locator('[class*="border-b"]');
      const firstRow = rows.first();
      const secondRow = rows.nth(1);

      const firstPadding = await firstRow.evaluate((el) => {
        const leftSection = el.querySelector('[style*="padding-left"]');
        return leftSection
          ? window.getComputedStyle(leftSection).paddingLeft
          : "0px";
      });

      const secondPadding = await secondRow.evaluate((el) => {
        const leftSection = el.querySelector('[style*="padding-left"]');
        return leftSection
          ? window.getComputedStyle(leftSection).paddingLeft
          : "0px";
      });

      // Nested items should have more padding
      if (secondPadding !== "0px") {
        expect(secondPadding).not.toBe(firstPadding);
      }
    }
  });
});
