import { expect, test } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const createPagePath = "database/destinations/agencies/create";
const agenciesListPath = "database/destinations/agencies";

test.describe("Create New Agency", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(createPagePath);
    await expect(
      page.getByRole("heading", { name: "Create New Agency" })
    ).toBeVisible({ timeout: 10000 });
  });

  test.describe("Page and form structure", () => {
    test("should display page title and description", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Create New Agency" })
      ).toBeVisible();
      await expect(
        page.getByText(/newly created agency will be active by default/i)
      ).toBeVisible();
    });

    test("should display all form section cards", async ({ page }) => {
      // Section names appear both as card titles and anchor links in sidebar,
      // so we use .first() to check the card title
      const main = page.getByRole("main");
      await expect(main.getByText("General Information")).toBeVisible();
      await expect(main.getByText("Contacts & Address").first()).toBeVisible();
      await expect(main.getByText("Payment Terms").first()).toBeVisible();
      await expect(main.getByText("Credit Terms").first()).toBeVisible();
      await expect(main.getByText("Agents").first()).toBeVisible();
      await expect(main.getByText("White label").first()).toBeVisible();
      await expect(main.getByText("AgentZone").first()).toBeVisible();
      await expect(main.getByText("Agency Affiliations").first()).toBeVisible();
      await expect(main.getByText("Additional IDs").first()).toBeVisible();
      await expect(main.getByText("Additional Notes").first()).toBeVisible();
    });

    test("should display General Information fields", async ({ page }) => {
      await expect(page.getByLabel(/agency name/i)).toBeVisible();
      await expect(page.getByLabel(/iata code/i)).toBeVisible();
      await expect(page.getByLabel(/agency group/i)).toBeVisible();
      await expect(page.getByLabel(/source market/i)).toBeVisible();
      await expect(page.getByLabel(/assigned sp/i)).toBeVisible();
    });

    test("should display Contacts & Address fields", async ({ page }) => {
      await expect(page.getByLabel(/^email/i)).toBeVisible();
      await expect(page.getByLabel(/phone/i)).toBeVisible();
    });

    test("should display header and footer actions", async ({ page }) => {
      const saveButtons = page.getByRole("button", {
        name: "Save New Agency",
      });
      const cancelButtons = page.getByRole("button", { name: "Cancel" });
      await expect(saveButtons.first()).toBeVisible();
      await expect(cancelButtons.first()).toBeVisible();
      await expect(saveButtons).toHaveCount(2);
      await expect(cancelButtons).toHaveCount(2);
    });
  });

  test.describe("Validation", () => {
    test("should show agency name error when submitting empty form", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Save New Agency" })
        .first()
        .click();
      await expect(page.getByText("Agency name is required")).toBeVisible();
    });

    test("should show all required field errors when only agency name is filled", async ({
      page,
    }) => {
      await page.getByLabel(/agency name/i).fill("Test Agency");
      await page
        .getByRole("button", { name: "Save New Agency" })
        .first()
        .click();

      await expect(page.getByText("Agency group is required")).toBeVisible();
      await expect(page.getByText("Source market is required")).toBeVisible();
      await expect(page.getByText("Assigned SP is required")).toBeVisible();
      await expect(page.getByText("Email is required")).toBeVisible();
    });

    test("should show credit terms note error when credit terms checked and note empty", async ({
      page,
    }) => {
      await page.getByLabel(/agency name/i).fill("Test Agency");
      await page.getByLabel(/agency group/i).click();
      await page.getByRole("option", { name: "WHElewana" }).click();
      await page.getByLabel(/source market/i).click();
      await page.getByRole("option", { name: "UK" }).click();
      await page.getByLabel(/assigned sp/i).click();
      await page.getByRole("option", { name: "Amelia Earhart" }).click();
      await page.getByLabel(/^email/i).fill("test@example.com");

      await page.getByLabel(/yes, has credit terms/i).check();
      await page
        .getByRole("button", { name: "Save New Agency" })
        .first()
        .click();

      await expect(
        page.getByText(/note is required when credit terms apply/i)
      ).toBeVisible();
    });
  });

  // Note: Create Agent functionality is only available on the Edit Agency page,
  // not on the Create New Agency page. See edit-agency tests for Create Agent flow.

  test.describe("Create agency and navigation", () => {
    test("should create agency and navigate to agency detail page", async ({
      page,
    }) => {
      const agencyName = `E2E Agency ${Date.now()}`;

      await page.getByLabel(/agency name/i).fill(agencyName);
      await page.getByLabel(/agency group/i).click();
      await page.getByRole("option", { name: "WHElewana" }).click();
      await page.getByLabel(/source market/i).click();
      await page.getByRole("option", { name: "UK" }).click();
      await page.getByLabel(/assigned sp/i).click();
      await page.getByRole("option", { name: "Amelia Earhart" }).click();
      await page.getByLabel(/^email/i).fill("e2e-agency@example.com");

      await page
        .getByRole("button", { name: "Save New Agency" })
        .first()
        .click();

      // After successful creation, user is navigated to the agency detail page
      await expect(page).toHaveURL(
        new RegExp(`${agenciesListPath}/[a-zA-Z0-9-]+$`),
        { timeout: 10000 }
      );
    });

    test("should cancel from header and redirect to agencies list", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Cancel" }).first().click();
      await expect(page).toHaveURL(new RegExp(`${agenciesListPath}$`), {
        timeout: 5000,
      });
    });

    test("should cancel from footer and redirect to agencies list", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Cancel" }).last().click();
      await expect(page).toHaveURL(new RegExp(`${agenciesListPath}$`), {
        timeout: 5000,
      });
    });
  });
});
