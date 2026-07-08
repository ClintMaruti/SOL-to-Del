import { expect, test } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const AGENCY_GROUPS_SEARCH_PLACEHOLDER =
  "Search agency group by name or description";

const agencyGroupsPath = "database/destinations/agency-groups";

test.describe("Agency Groups List", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(agencyGroupsPath);
    await page
      .getByPlaceholder(AGENCY_GROUPS_SEARCH_PLACEHOLDER)
      .waitFor({ timeout: 10000 });
  });

  test.describe("View Agency Groups List", () => {
    test("should display agency groups page header", async ({ page }) => {
      const header = page.getByRole("heading", {
        name: /agency groups/i,
      });
      await expect(header).toBeVisible();
    });

    test("should display agency groups table with headers", async ({
      page,
    }) => {
      const table = page.locator("table");
      await expect(table.getByText("Group Name")).toBeVisible();
      await expect(table.getByText("Number of agencies")).toBeVisible();
      await expect(table.getByText("Description")).toBeVisible();
      await expect(table.getByText("Active")).toBeVisible();
    });

    test("should display agency groups in the table", async ({ page }) => {
      await expect(page.getByText("AAConsultants")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText("AngamaSpecial")).toBeVisible();
      await expect(page.getByText("ZooGroup")).toBeVisible();
    });

    test("should display Create button", async ({ page }) => {
      const createButton = page.getByRole("button", { name: /create/i });
      await expect(createButton).toBeVisible();
    });

    test("should display search input", async ({ page }) => {
      const searchInput = page.getByPlaceholder(
        AGENCY_GROUPS_SEARCH_PLACEHOLDER
      );
      await expect(searchInput).toBeVisible();
    });

    test("should format agency count (1 Agency / N Agencies)", async ({
      page,
    }) => {
      await expect(page.getByText("1 Agency")).toBeVisible();
      await expect(page.getByText("6 Agencies")).toBeVisible();
      await expect(page.getByText("12 Agencies")).toBeVisible();
    });
  });

  test.describe("Search Functionality", () => {
    test("should filter agency groups when searching by name", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder(
        AGENCY_GROUPS_SEARCH_PLACEHOLDER
      );
      await searchInput.fill("Angama");

      await expect(page.getByText("AngamaSpecial")).toBeVisible();
      await expect(page.getByText("AAConsultants")).not.toBeVisible();
    });

    test("should filter agency groups when searching by description", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder(
        AGENCY_GROUPS_SEARCH_PLACEHOLDER
      );
      await searchInput.fill("Wholesale");

      await expect(page.getByText("AngamaSpecial")).toBeVisible();
      await expect(page.getByText("AAConsultants")).not.toBeVisible();
    });

    test("should show No match when search has no results", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder(
        AGENCY_GROUPS_SEARCH_PLACEHOLDER
      );
      await searchInput.fill("NonExistentGroupXYZ");

      await expect(page.getByText("No match")).toBeVisible();
    });

    test("should show all groups when search is cleared", async ({ page }) => {
      const searchInput = page.getByPlaceholder(
        AGENCY_GROUPS_SEARCH_PLACEHOLDER
      );
      await searchInput.fill("Zoo");
      await expect(page.getByText("AAConsultants")).not.toBeVisible();

      await searchInput.clear();
      await expect(page.getByText("AAConsultants")).toBeVisible();
      await expect(page.getByText("ZooGroup")).toBeVisible();
    });
  });

  test.describe("Sorting", () => {
    test("should sort by group name when header is clicked", async ({
      page,
    }) => {
      const nameHeader = page.getByRole("button", { name: /group name/i });
      await nameHeader.click();

      await page.waitForTimeout(500);

      const firstCell = page.locator("tbody tr:first-child td:first-child");
      const text = await firstCell.textContent();
      expect(text?.toLowerCase()).toMatch(/aaconsultants/);
    });

    test("should toggle sort direction on second click", async ({ page }) => {
      const nameHeader = page.getByRole("button", { name: /group name/i });

      await nameHeader.click();
      await page.waitForTimeout(300);

      await nameHeader.click();
      await page.waitForTimeout(300);

      const firstCell = page.locator("tbody tr:first-child td:first-child");
      const text = await firstCell.textContent();
      expect(text?.toLowerCase()).toMatch(/zoo/);
    });
  });

  test.describe("Delete Agency Group Flow", () => {
    test("should open actions menu when three-dot button is clicked", async ({
      page,
    }) => {
      const actionsButton = page
        .getByRole("button", { name: /actions/i })
        .first();
      await actionsButton.click();

      await expect(page.getByText("Delete")).toBeVisible();
    });

    test("should open delete dialog when Delete is clicked for group without agencies", async ({
      page,
    }) => {
      const standaloneRow = page.locator("tbody tr").filter({
        has: page.getByText("StandaloneGroup"),
      });
      const actionsButton = standaloneRow.getByRole("button", {
        name: /actions/i,
      });
      await actionsButton.click();

      await page.getByText("Delete").first().click();

      await expect(
        page.getByRole("heading", { name: "Delete Agency Group" })
      ).toBeVisible();
      await expect(
        page.getByText(/this agency group will be removed/i)
      ).toBeVisible();
    });

    test("should show blocked dialog when trying to delete group with agencies", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: /actions/i })
        .first()
        .click();
      await page.getByText("Delete").first().click();

      await expect(page.getByText("Reassign agencies first")).toBeVisible();
      await expect(
        page.getByText(/this group contains agencies/i)
      ).toBeVisible();
    });

    test("should close blocked dialog when Ok is clicked", async ({ page }) => {
      await page
        .getByRole("button", { name: /actions/i })
        .first()
        .click();
      await page.getByText("Delete").first().click();

      await expect(page.getByText("Reassign agencies first")).toBeVisible();

      const okButton = page.getByRole("button", { name: /ok/i });
      await okButton.click();

      await expect(page.getByText("Reassign agencies first")).not.toBeVisible();
    });

    test("should close delete dialog when Cancel is clicked", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: /actions/i })
        .first()
        .click();
      await page.getByText("Delete").first().click();

      await expect(
        page.getByRole("heading", { name: "Delete Agency Group" })
      ).toBeVisible();

      await page.getByRole("button", { name: /cancel/i }).click();

      await expect(
        page.getByRole("heading", { name: "Delete Agency Group" })
      ).not.toBeVisible();
    });

    test("should delete agency group and remove from list when confirmed", async ({
      page,
    }) => {
      await expect(page.getByText("StandaloneGroup")).toBeVisible();

      const standaloneRow = page.locator("tbody tr").filter({
        has: page.getByText("StandaloneGroup"),
      });
      const actionsButton = standaloneRow.getByRole("button", {
        name: /actions/i,
      });
      await actionsButton.click();

      await page.getByText("Delete").first().click();

      await expect(
        page.getByRole("heading", { name: "Delete Agency Group" })
      ).toBeVisible();

      await page.getByRole("button", { name: /delete agency group/i }).click();

      await expect(
        page.getByRole("heading", { name: "Delete Agency Group" })
      ).not.toBeVisible({ timeout: 10000 });

      await expect(page.getByText("StandaloneGroup")).not.toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Empty State", () => {
    test.skip("should display empty state when no agency groups exist", async () => {
      // Would require clearing all groups first; skip for test isolation
    });
  });
});
