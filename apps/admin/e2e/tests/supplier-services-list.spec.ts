import { test, expect, type Page } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const SUPPLIERS_LIST_PATH = "database/destinations/suppliers";

/**
 * Opens the first supplier from the list and navigates to the Services tab.
 */
async function openFirstSupplierAndGoToServicesTab(page: Page) {
  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toBeVisible({ timeout: 10000 });
  const nameButton = firstRow.getByRole("button").first();
  await nameButton.click();
  await page.waitForURL(new RegExp(`suppliers/[^/]+$`), { timeout: 10000 });

  await page.getByRole("tab", { name: /services/i }).click();
  await expect(page.getByText("Service").first()).toBeVisible({
    timeout: 10000,
  });
}

test.describe("Supplier Services List", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(SUPPLIERS_LIST_PATH);
    await expect(page.getByText("Suppliers").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test.describe("List and headers", () => {
    test("should display Services section with table headers", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToServicesTab(page);

      await expect(page.getByRole("heading", { name: "Services" })).toBeVisible(
        { timeout: 10000 }
      );
      await expect(page.getByText("Type").first()).toBeVisible();
      await expect(page.getByText("Service").first()).toBeVisible();
      await expect(page.getByText("Status").first()).toBeVisible();
      await expect(page.getByText("Options").first()).toBeVisible();
      await expect(page.getByText("Rates").first()).toBeVisible();
      await expect(page.getByText("Rate Plans").first()).toBeVisible();
      await expect(page.getByText("Actions").first()).toBeVisible();
    });

    test("should display service rows and Create Service button", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToServicesTab(page);

      await expect(page.getByRole("link", { name: "Camp" })).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByRole("button", { name: /create service/i })
      ).toBeVisible();
    });
  });

  test.describe("Activate flow – confirm dialog", () => {
    test("should open confirm dialog when clicking status switch on inactive service", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToServicesTab(page);

      const inactiveServiceRow = page
        .locator("tbody tr")
        .filter({ hasText: "Transfer Package" });
      await expect(inactiveServiceRow).toBeVisible({ timeout: 10000 });
      await inactiveServiceRow.getByRole("switch").click();

      await expect(
        page.getByRole("heading", { name: /activate this service\?/i })
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: /activate/i })
      ).toBeVisible();
    });

    test("should show Cancel and Activate buttons in confirm dialog", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToServicesTab(page);

      const inactiveServiceRow = page
        .locator("tbody tr")
        .filter({ hasText: "Transfer Package" });
      await expect(inactiveServiceRow).toBeVisible({ timeout: 10000 });
      await inactiveServiceRow.getByRole("switch").click();

      await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /activate/i })
      ).toBeVisible();
    });
  });

  test.describe("Deactivate flow – confirm dialog", () => {
    test("should open confirm dialog when clicking status switch on active service", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToServicesTab(page);

      const activeServiceRow = page
        .locator("tbody tr")
        .filter({ hasText: "Camp" });
      await expect(activeServiceRow).toBeVisible({ timeout: 10000 });
      await activeServiceRow.getByRole("switch").click();

      await expect(
        page.getByRole("heading", { name: /deactivate this service\?/i })
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByRole("button", { name: /deactivate/i })
      ).toBeVisible();
    });
  });

  test.describe("Confirm dialog – cancel", () => {
    test("should close confirm dialog when Cancel is clicked", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToServicesTab(page);

      const inactiveServiceRow = page
        .locator("tbody tr")
        .filter({ hasText: "Transfer Package" });
      await expect(inactiveServiceRow).toBeVisible({ timeout: 10000 });
      await inactiveServiceRow.getByRole("switch").click();

      await expect(
        page.getByRole("heading", { name: /activate this service\?/i })
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: /cancel/i }).click();

      await expect(
        page.getByRole("heading", { name: /activate this service\?/i })
      ).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Confirm dialog – confirm activate", () => {
    test("should activate service when Activate is confirmed and close dialog", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToServicesTab(page);

      const inactiveServiceRow = page
        .locator("tbody tr")
        .filter({ hasText: "Transfer Package" });
      await expect(inactiveServiceRow).toBeVisible({ timeout: 10000 });
      await inactiveServiceRow.getByRole("switch").click();

      await expect(
        page.getByRole("heading", { name: /activate this service\?/i })
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: /activate/i }).click();

      await expect(
        page.getByRole("heading", { name: /activate this service\?/i })
      ).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Row actions menu", () => {
    test("should show Edit and Delete in row actions menu", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToServicesTab(page);

      const campRow = page.locator("tbody tr").filter({ hasText: "Camp" });
      await expect(campRow).toBeVisible({ timeout: 10000 });
      await campRow.getByRole("button", { name: /actions for camp/i }).click();

      await expect(page.getByRole("menuitem", { name: /^edit$/i })).toBeVisible(
        { timeout: 5000 }
      );
      await expect(
        page.getByRole("menuitem", { name: /^delete$/i })
      ).toBeVisible();
    });

    test("should navigate to service detail when Edit is clicked", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToServicesTab(page);

      const campRow = page.locator("tbody tr").filter({ hasText: "Camp" });
      await expect(campRow).toBeVisible({ timeout: 10000 });
      await campRow.getByRole("button", { name: /actions for camp/i }).click();

      await page.getByRole("menuitem", { name: /^edit$/i }).click();

      await page.waitForURL(/suppliers\/[^/]+\/services\/[^/]+/, {
        timeout: 10000,
      });
    });
  });

  test.describe("Delete dialog", () => {
    test("should open delete dialog when Delete is clicked and close on Cancel", async ({
      page,
    }) => {
      await openFirstSupplierAndGoToServicesTab(page);

      const campRow = page.locator("tbody tr").filter({ hasText: "Camp" });
      await expect(campRow).toBeVisible({ timeout: 10000 });
      await campRow.getByRole("button", { name: /actions for camp/i }).click();

      await page.getByRole("menuitem", { name: /^delete$/i }).click();

      await expect(
        page.getByRole("heading", { name: /delete service/i })
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(
          /this service will be removed from active use but kept in the system/i
        )
      ).toBeVisible();

      await page.getByRole("button", { name: /cancel/i }).click();

      await expect(
        page.getByRole("heading", { name: /delete service/i })
      ).not.toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe("Supplier Service Options cold load", () => {
  test("does not show a route-level content loader between auth and options UI", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.addInitScript(() => {
      type RouteLoaderWindow = Window & {
        __routeLevelLoaderSamples?: number;
      };
      const routeWindow = window as RouteLoaderWindow;
      routeWindow.__routeLevelLoaderSamples = 0;

      const scanForRouteLoader = () => {
        if (document.querySelector('main > [role="status"]')) {
          routeWindow.__routeLevelLoaderSamples =
            (routeWindow.__routeLevelLoaderSamples ?? 0) + 1;
        }
      };

      const startObserver = () => {
        scanForRouteLoader();
        new MutationObserver(scanForRouteLoader).observe(
          document.documentElement,
          { childList: true, subtree: true }
        );
      };

      if (document.documentElement) {
        startObserver();
      } else {
        document.addEventListener("DOMContentLoaded", startObserver, {
          once: true,
        });
      }
    });

    await page.goto(
      "database/destinations/suppliers/sup-1/services/service-1?tab=options"
    );

    await expect(page.getByRole("heading", { name: "Camp" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("tab", { name: "Options" })).toBeVisible();
    await expect(page.getByText("Full Board").first()).toBeVisible({
      timeout: 10000,
    });

    await expect(page.locator('main > [role="status"]')).toHaveCount(0);
    const routeLevelLoaderSamples = await page.evaluate(() => {
      return (
        (window as Window & { __routeLevelLoaderSamples?: number })
          .__routeLevelLoaderSamples ?? 0
      );
    });
    expect(routeLevelLoaderSamples).toBe(0);
  });
});
