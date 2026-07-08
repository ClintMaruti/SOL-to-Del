import { expect, test } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const supplierHeadOfficesListPath =
  "database/destinations/supplier-head-offices";
const createPagePath = "database/destinations/supplier-head-offices/create";

test.describe("Create Supplier Head Office", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(supplierHeadOfficesListPath);
    await page
      .getByPlaceholder("Search Head Office by name or email")
      .waitFor({ timeout: 10000 });
  });

  test.describe("Navigation and form structure", () => {
    test("should navigate to create page when clicking Create button", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Create" }).click();
      await page.waitForURL(new RegExp(`${createPagePath}$`), {
        timeout: 10000,
      });

      await expect(
        page.getByRole("heading", { name: "Create Head Office" })
      ).toBeVisible();
    });

    test("should display page title and description", async ({ page }) => {
      await page.getByRole("button", { name: "Create" }).click();
      await page.waitForURL(new RegExp(`${createPagePath}$`), {
        timeout: 10000,
      });

      await expect(
        page.getByRole("heading", { name: "Create Head Office" })
      ).toBeVisible();
      await expect(
        page.getByText(
          /add a new head office to the system\. its supplier will be available for assignment once created/i
        )
      ).toBeVisible();
    });

    test("should display all form section cards", async ({ page }) => {
      await page.getByRole("button", { name: "Create" }).click();
      await page.waitForURL(new RegExp(`${createPagePath}$`), {
        timeout: 10000,
      });

      const main = page.getByRole("main");
      await expect(main.getByText("General Information").first()).toBeVisible();
      await expect(main.getByText("Contacts & Address").first()).toBeVisible();
      await expect(main.getByText("Suppliers").first()).toBeVisible();
    });

    test("should display required fields", async ({ page }) => {
      await page.getByRole("button", { name: "Create" }).click();
      await page.waitForURL(new RegExp(`${createPagePath}$`), {
        timeout: 10000,
      });

      await expect(page.getByLabel(/^name/i)).toBeVisible();
      await expect(page.getByLabel(/^email/i)).toBeVisible();
      await expect(page.getByLabel(/^phone/i)).toBeVisible();
    });

    test("should display Cancel and Save New Head Office buttons", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Create" }).click();
      await page.waitForURL(new RegExp(`${createPagePath}$`), {
        timeout: 10000,
      });

      await expect(
        page.getByRole("button", { name: /cancel/i }).first()
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Save New Head Office" }).first()
      ).toBeVisible();
    });
  });

  test.describe("Validation", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("button", { name: "Create" }).click();
      await page.waitForURL(new RegExp(`${createPagePath}$`), {
        timeout: 10000,
      });
    });

    test("should show Name is required when submitting empty form", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Save New Head Office" })
        .first()
        .click();

      await expect(page.getByText(/name is required/i)).toBeVisible();
    });

    test("should show validation error when name is too short", async ({
      page,
    }) => {
      await page.getByLabel(/^name/i).fill("Ab");
      await page.getByLabel(/^email/i).fill("a@b.com");
      await page.getByLabel(/^phone/i).fill("+1234567890");

      await page
        .getByRole("button", { name: "Save New Head Office" })
        .first()
        .click();

      await expect(
        page.getByText(/name must contain at least 3 characters/i)
      ).toBeVisible();
    });
  });

  test.describe("Cancel and navigation", () => {
    test("should not show unsaved changes dialog when form is pristine", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Create" }).click();
      await page.waitForURL(new RegExp(`${createPagePath}$`), {
        timeout: 10000,
      });

      await page
        .getByRole("button", { name: /cancel/i })
        .first()
        .click();

      await page.waitForURL(new RegExp(supplierHeadOfficesListPath), {
        timeout: 10000,
      });
      await expect(
        page.getByRole("heading", { name: "Head Offices" })
      ).toBeVisible();
    });
  });

  test.describe("Create and navigate", () => {
    test("should create head office and navigate to detail page", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Create" }).click();
      await page.waitForURL(new RegExp(`${createPagePath}$`), {
        timeout: 10000,
      });

      const headOfficeName = `E2E Head Office ${Date.now()}`;
      await page.getByLabel(/^name/i).fill(headOfficeName);
      await page
        .getByLabel(/^email/i)
        .fill(`e2e-headoffice-${Date.now()}@example.com`);
      await page.getByLabel(/^phone/i).fill("+254712345678");

      await page
        .getByRole("button", { name: "Save New Head Office" })
        .first()
        .click();

      await expect(page).toHaveURL(
        new RegExp(`${supplierHeadOfficesListPath}/[a-zA-Z0-9-]+$`),
        { timeout: 10000 }
      );
      await expect(
        page.getByRole("heading", { name: headOfficeName })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should cancel from create page and redirect to list", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Create" }).click();
      await page.waitForURL(new RegExp(`${createPagePath}$`), {
        timeout: 10000,
      });

      await page
        .getByRole("button", { name: /cancel/i })
        .first()
        .click();

      await expect(page).toHaveURL(
        new RegExp(`${supplierHeadOfficesListPath}$`),
        {
          timeout: 5000,
        }
      );
    });
  });
});
