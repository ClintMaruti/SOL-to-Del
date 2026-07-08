import { expect, test } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const supplierHeadOfficesPath = "database/destinations/supplier-head-offices";

test.describe("Edit Supplier Head Office", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(supplierHeadOfficesPath);
    await page
      .getByPlaceholder("Search Head Office by name or email")
      .waitFor({ timeout: 10000 });
  });

  test.describe("Open detail page", () => {
    test("should open head office detail when clicking head office name", async ({
      page,
    }) => {
      await expect(page.getByText("Elewana Collection").first()).toBeVisible({
        timeout: 10000,
      });

      await page
        .getByRole("link", { name: "Elewana Collection" })
        .first()
        .click();

      await page.waitForURL(new RegExp(`supplier-head-offices/sho-1$`), {
        timeout: 10000,
      });

      await expect(
        page.getByRole("heading", { name: "Elewana Collection" })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display General Information section", async ({ page }) => {
      await page
        .getByRole("link", { name: "Elewana Collection" })
        .first()
        .click();

      await expect(page.getByText("General Information").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("should display Contacts & Address section", async ({ page }) => {
      await page
        .getByRole("link", { name: "Elewana Collection" })
        .first()
        .click();

      await expect(page.getByText("Contacts & Address").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("should display Suppliers section", async ({ page }) => {
      await page
        .getByRole("link", { name: "Elewana Collection" })
        .first()
        .click();

      await expect(page.getByText("Suppliers").first()).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Form actions", () => {
    test.beforeEach(async ({ page }) => {
      await page
        .getByRole("link", { name: "Elewana Collection" })
        .first()
        .click();
      await expect(
        page.getByRole("heading", { name: "Elewana Collection" })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display Cancel and Save buttons", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /cancel/i }).first()
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^Save$/i }).first()
      ).toBeVisible();
    });

    test("should display Active toggle in header", async ({ page }) => {
      await expect(page.getByText("Active").first()).toBeVisible();
      await expect(
        page.getByRole("switch", {
          name: /toggle elewana collection active status/i,
        })
      ).toBeVisible();
    });

    test("should display section anchor links", async ({ page }) => {
      await expect(page.getByRole("link", { name: "General" })).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Contacts & Address" })
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Suppliers" })).toBeVisible();
    });
  });

  test.describe("Suppliers table", () => {
    test.beforeEach(async ({ page }) => {
      await page
        .getByRole("link", { name: "Elewana Collection" })
        .first()
        .click();
      await expect(
        page.getByRole("heading", { name: "Elewana Collection" })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display Suppliers table with columns when head office has suppliers", async ({
      page,
    }) => {
      await expect(page.getByText("Supplier").first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText("Destination").first()).toBeVisible();
      await expect(page.getByText("Email").first()).toBeVisible();
      await expect(page.getByText("Active").first()).toBeVisible();
      await expect(page.getByText("Actions").first()).toBeVisible();
    });

    test("should have Actions menu with Edit and Delete", async ({ page }) => {
      const firstActionsButton = page
        .getByRole("button", { name: /actions for/i })
        .first();
      await firstActionsButton.waitFor({ timeout: 5000 });
      await firstActionsButton.click();

      await expect(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Delete" })
      ).toBeVisible();
    });
  });

  test.describe("Delete supplier from head office", () => {
    test.beforeEach(async ({ page }) => {
      await page
        .getByRole("link", { name: "Elewana Collection" })
        .first()
        .click();
      await expect(
        page.getByRole("heading", { name: "Elewana Collection" })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should open delete dialog when Delete is clicked from supplier row actions", async ({
      page,
    }) => {
      const actionsButton = page
        .getByRole("button", { name: /actions for/i })
        .first();
      await actionsButton.waitFor({ timeout: 5000 });
      await actionsButton.click();

      await page.getByRole("menuitem", { name: "Delete" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Delete supplier from Head Office",
        })
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(/delete.*from this head office\?/i)
      ).toBeVisible();
    });

    test("should display Cancel and Delete buttons in delete dialog", async ({
      page,
    }) => {
      const actionsButton = page
        .getByRole("button", { name: /actions for/i })
        .first();
      await actionsButton.waitFor({ timeout: 5000 });
      await actionsButton.click();
      await page.getByRole("menuitem", { name: "Delete" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Delete supplier from Head Office",
        })
      ).toBeVisible({ timeout: 5000 });

      await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^Delete$/i })
      ).toBeVisible();
    });

    test("should close delete dialog when Cancel is clicked", async ({
      page,
    }) => {
      const actionsButton = page
        .getByRole("button", { name: /actions for/i })
        .first();
      await actionsButton.waitFor({ timeout: 5000 });
      await actionsButton.click();
      await page.getByRole("menuitem", { name: "Delete" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Delete supplier from Head Office",
        })
      ).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: /cancel/i }).click();

      await expect(
        page.getByRole("heading", {
          name: "Delete supplier from Head Office",
        })
      ).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Not found", () => {
    test("should show not found when opening invalid head office id", async ({
      page,
    }) => {
      await page.goto(`${supplierHeadOfficesPath}/non-existent-head-office-id`);

      await expect(page.getByText("Head office not found")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByRole("button", { name: "Back to Head Offices" })
      ).toBeVisible();
    });
  });
});
