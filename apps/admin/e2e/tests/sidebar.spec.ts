import { expect, Page, test } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

// Page Objects (inline with tests)
class MainSidebar {
  constructor(private page: Page) {}

  get sidebar() {
    return this.page.locator("[data-main-sidebar]");
  }

  async expand() {
    const expandButton = this.page.getByRole("button", {
      name: /expand sidebar/i,
    });
    await expandButton.click();
    await expect(this.sidebar).toHaveCSS("width", "256px");
  }

  async collapse() {
    const collapseButton = this.page.getByRole("button", {
      name: /collapse sidebar/i,
    });
    await collapseButton.click();
    await expect(this.sidebar).toHaveCSS("width", "48px");
  }

  async clickDatabase() {
    return this.sidebar.getByRole("button", { name: /database/i }).click();
  }

  async clickDestinationSubItem() {
    return this.sidebar.getByRole("button", { name: /^destination$/i }).click();
  }

  getDatabaseButton() {
    return this.sidebar.getByRole("button", { name: /database/i });
  }

  getDestinationSubItem() {
    return this.sidebar.getByRole("button", { name: /^destination$/i });
  }

  getLogoButton() {
    return this.sidebar.getByRole("button").first();
  }

  async waitForSubItems() {
    await expect(this.getDestinationSubItem()).toBeVisible();
  }
}

class PageSidebar {
  constructor(private page: Page) {}

  get sidebar() {
    return this.page.locator("[data-page-sidebar]");
  }

  async expectVisible() {
    await expect(this.sidebar).toBeVisible();
  }

  async expectTitle(title: string) {
    await expect(this.sidebar.getByText(title)).toBeVisible();
  }

  getItem(name: string | RegExp) {
    return this.sidebar.getByRole("button", { name });
  }

  async expectItemVisible(name: string | RegExp) {
    await expect(this.getItem(name)).toBeVisible();
  }

  async expectItemActive(name: string | RegExp) {
    const item = this.getItem(name);
    await expect(item).toHaveClass(/bg-brand-tetriary/);
  }
}

test.describe("Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
  });

  test("should display main sidebar with navigation items", async ({
    page,
  }) => {
    const mainSidebar = new MainSidebar(page);
    await expect(mainSidebar.sidebar).toBeVisible();

    // Check that main navigation items are visible
    await expect(mainSidebar.getDatabaseButton()).toBeVisible();
  });

  test("should display SOL logo in sidebar", async ({ page }) => {
    const mainSidebar = new MainSidebar(page);
    const logoButton = mainSidebar.getLogoButton();
    await expect(logoButton).toBeVisible();

    // Check logo image is present
    const logoImage = logoButton.locator("img[alt='SOL Logo']");
    await expect(logoImage).toBeVisible();
  });

  test("should expand and collapse navigation items with children", async ({
    page,
  }) => {
    const mainSidebar = new MainSidebar(page);

    // First, ensure sidebar is expanded (default is collapsed)
    await expect(mainSidebar.sidebar).toHaveCSS("width", "48px");
    await mainSidebar.expand();

    // Now click the database button to expand the menu item
    await mainSidebar.clickDatabase();

    // Wait for sub-items to appear and check they're visible
    await expect(mainSidebar.getDestinationSubItem()).toBeVisible();
    await expect(
      mainSidebar.sidebar.getByRole("button", { name: /service types/i })
    ).toBeVisible();
    await expect(
      mainSidebar.sidebar.getByRole("button", { name: /rate types/i })
    ).toBeVisible();

    // Click again to collapse the menu item
    await mainSidebar.clickDatabase();

    // Sub-items should not be visible after collapse
    await expect(mainSidebar.getDestinationSubItem()).not.toBeVisible();
  });

  test("should display page sidebar when selecting item with children", async ({
    page,
  }) => {
    const mainSidebar = new MainSidebar(page);
    const pageSidebar = new PageSidebar(page);

    // First, ensure sidebar is expanded (default is collapsed)
    await expect(mainSidebar.sidebar).toHaveCSS("width", "48px");
    await mainSidebar.expand();

    // Expand the database menu item to show children
    await mainSidebar.clickDatabase();
    await mainSidebar.waitForSubItems();

    // Click on a child item (Destination) to trigger page sidebar
    await mainSidebar.clickDestinationSubItem();

    // Wait for page sidebar to appear
    await pageSidebar.expectVisible();
    await pageSidebar.expectTitle("Database");

    // Check that page sidebar items are displayed
    await pageSidebar.expectItemVisible(/destinations/i);
    await pageSidebar.expectItemVisible(/agency groups/i);
    await pageSidebar.expectItemVisible(/agencies/i);
    await pageSidebar.expectItemVisible(/agents/i);
  });

  test("should select sub-item in main sidebar and show page sidebar", async ({
    page,
  }) => {
    const mainSidebar = new MainSidebar(page);
    const pageSidebar = new PageSidebar(page);

    // First, ensure sidebar is expanded (default is collapsed)
    await expect(mainSidebar.sidebar).toHaveCSS("width", "48px");
    await mainSidebar.expand();

    // Expand database item to show children
    await mainSidebar.clickDatabase();
    await mainSidebar.waitForSubItems();

    // Click on destination sub-item
    await mainSidebar.clickDestinationSubItem();

    // Page sidebar should appear
    await pageSidebar.expectVisible();

    // First item in page sidebar should be selected by default (uses bg-gray-200)
    await pageSidebar.expectItemActive(/destinations/i);
  });

  test("should toggle main sidebar collapse", async ({ page }) => {
    const mainSidebar = new MainSidebar(page);

    // Sidebar should be collapsed initially (default state, w-12 = 48px)
    await expect(mainSidebar.sidebar).toHaveCSS("width", "48px");

    // Click expand button to expand sidebar
    await mainSidebar.expand();

    // Click collapse button to collapse sidebar
    await mainSidebar.collapse();

    // Click expand button again to verify toggle works both ways
    await mainSidebar.expand();
  });

  test("should display collapsed sidebar with icons only", async ({ page }) => {
    const mainSidebar = new MainSidebar(page);

    // Sidebar should be collapsed by default (w-12 = 48px)
    await expect(mainSidebar.sidebar).toHaveCSS("width", "48px");

    // Navigation items should still be visible but as icon buttons
    // In collapsed state, buttons use aria-label with item.label
    const databaseButton = mainSidebar.sidebar.getByRole("button", {
      name: "Database",
    });
    await expect(databaseButton).toBeVisible();

    // The button should have aria-label for accessibility
    await expect(databaseButton).toHaveAttribute("aria-label", "Database");
  });

  test("should handle navigation with database section", async ({ page }) => {
    const mainSidebar = new MainSidebar(page);
    const pageSidebar = new PageSidebar(page);

    // Ensure sidebar is expanded first
    await expect(mainSidebar.sidebar).toHaveCSS("width", "48px");
    await mainSidebar.expand();

    // Expand the database menu item
    await mainSidebar.clickDatabase();
    await mainSidebar.waitForSubItems();

    // Click on destination sub-item to show page sidebar
    await mainSidebar.clickDestinationSubItem();

    await pageSidebar.expectVisible();
    await pageSidebar.expectTitle("Database");

    // Verify page sidebar items are displayed
    await pageSidebar.expectItemVisible(/destinations/i);
    await pageSidebar.expectItemVisible(/agency groups/i);
    await pageSidebar.expectItemVisible(/agencies/i);
    await pageSidebar.expectItemVisible(/agents/i);
  });
});
