import { expect, test } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const agencyGroupsPath = "database/destinations/agency-groups";

test.describe("Edit Agency Group", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(agencyGroupsPath);
    await page
      .getByPlaceholder("Search agency group by name or description")
      .waitFor({ timeout: 10000 });
  });

  test.describe("Open detail page", () => {
    test("should navigate to detail page when clicking group name", async ({
      page,
    }) => {
      await expect(page.getByText("AAConsultants").first()).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("button", { name: "AAConsultants" }).first().click();

      await page.waitForURL(new RegExp(`agency-groups/ag-1$`), {
        timeout: 10000,
      });

      await expect(
        page.getByRole("heading", { name: "AAConsultants" })
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Form sections", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("button", { name: "AAConsultants" }).first().click();
      await expect(
        page.getByRole("heading", { name: "AAConsultants" })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display General Information section", async ({ page }) => {
      await expect(page.getByText("General Information").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("should display Agencies section", async ({ page }) => {
      await expect(page.getByText("Agencies").first()).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Form actions", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("button", { name: "AAConsultants" }).first().click();
      await expect(
        page.getByRole("heading", { name: "AAConsultants" })
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
          name: /toggle aaconsultants active status/i,
        })
      ).toBeVisible();
    });

    test("should display section anchor links", async ({ page }) => {
      await expect(page.getByRole("link", { name: "General" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Agencies" })).toBeVisible();
    });
  });

  test.describe("Active toggle", () => {
    test("should toggle active status when switch is clicked", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "AAConsultants" }).first().click();
      await expect(
        page.getByRole("heading", { name: "AAConsultants" })
      ).toBeVisible({ timeout: 10000 });

      const toggle = page.getByRole("switch", {
        name: /toggle aaconsultants active status/i,
      });
      await expect(toggle).toBeVisible();

      const initialState = await toggle.getAttribute("aria-checked");
      await toggle.click();
      await expect(toggle).not.toHaveAttribute("aria-checked", initialState!, {
        timeout: 5000,
      });
    });
  });

  test.describe("Not found", () => {
    test("should show not found when opening invalid group id", async ({
      page,
    }) => {
      await page.goto(`${agencyGroupsPath}/non-existent-group-id`);

      await expect(page.getByText("Agency group not found")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByRole("button", { name: "Back to Agency Groups" })
      ).toBeVisible();
    });
  });
});
