import { expect, test } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const createPagePath = "database/destinations/agency-groups/create";
const agencyGroupsListPath = "database/destinations/agency-groups";

test.describe("Create New Agency Group", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(createPagePath);
    await expect(
      page.getByRole("heading", { name: "Create New Agency Group" })
    ).toBeVisible({ timeout: 10000 });
  });

  test.describe("Page and form structure", () => {
    test("should display page title and description", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Create New Agency Group" })
      ).toBeVisible();
      await expect(
        page.getByText(/newly created group will be active by default/i)
      ).toBeVisible();
    });

    test("should display General Information section only on create", async ({
      page,
    }) => {
      const main = page.getByRole("main");
      await expect(main.getByText("General Information").first()).toBeVisible();
      await expect(page.getByRole("link", { name: "General" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Agencies" })).toHaveCount(0);
    });

    test("should display General Information fields", async ({ page }) => {
      await expect(page.getByLabel(/group name/i)).toBeVisible();
      await expect(page.getByLabel(/description/i)).toBeVisible();
    });

    test("should display header and footer actions", async ({ page }) => {
      const saveButtons = page.getByRole("button", {
        name: "Save New Agency Group",
      });
      const cancelButtons = page.getByRole("button", { name: "Cancel" });
      await expect(saveButtons.first()).toBeVisible();
      await expect(cancelButtons.first()).toBeVisible();
      await expect(saveButtons).toHaveCount(2);
      await expect(cancelButtons).toHaveCount(2);
    });
  });

  test.describe("Validation", () => {
    test("should show Group Name error when submitting empty form", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Save New Agency Group" })
        .first()
        .click();
      await expect(page.getByText(/group name is required/i)).toBeVisible();
    });
  });

  test.describe("Create agency group and navigation", () => {
    test("should create agency group and navigate to detail page", async ({
      page,
    }) => {
      const groupName = `E2E Agency Group ${Date.now()}`;

      await page.getByLabel(/group name/i).fill(groupName);
      await page
        .getByRole("button", { name: "Save New Agency Group" })
        .first()
        .click();

      await expect(page).toHaveURL(
        new RegExp(`${agencyGroupsListPath}/[a-zA-Z0-9-]+$`),
        { timeout: 10000 }
      );
    });

    test("should cancel from header and redirect to agency groups list", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Cancel" }).first().click();
      await expect(page).toHaveURL(new RegExp(`${agencyGroupsListPath}$`), {
        timeout: 5000,
      });
    });

    test("should cancel from footer and redirect to agency groups list", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Cancel" }).last().click();
      await expect(page).toHaveURL(new RegExp(`${agencyGroupsListPath}$`), {
        timeout: 5000,
      });
    });
  });

  test.describe("Navigation from agency groups list", () => {
    test("should navigate from agency groups list to create page and back", async ({
      page,
    }) => {
      await page.goto(agencyGroupsListPath);
      await page
        .getByPlaceholder("Search agency group by name or description")
        .waitFor({ timeout: 10000 });

      await page.getByRole("button", { name: /create/i }).click();

      await expect(page).toHaveURL(new RegExp(`${createPagePath}$`), {
        timeout: 5000,
      });
      await expect(
        page.getByRole("heading", { name: "Create New Agency Group" })
      ).toBeVisible();

      await page.getByRole("button", { name: "Cancel" }).first().click();

      await expect(page).toHaveURL(new RegExp(`${agencyGroupsListPath}$`), {
        timeout: 5000,
      });
      await expect(
        page.getByRole("heading", { name: /agency groups/i })
      ).toBeVisible();
    });
  });
});
