import { expect, test } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const supplierHeadOfficesPath = "database/destinations/supplier-head-offices";

test.describe("Delete Supplier Head Office", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(supplierHeadOfficesPath);
    await page
      .getByPlaceholder("Search Head Office by name or email")
      .waitFor({ timeout: 10000 });
  });

  test.describe("Delete dialog opening", () => {
    test("should open delete dialog when Delete is clicked from actions menu", async ({
      page,
    }) => {
      const actionsButton = page.getByRole("button", {
        name: /actions for serengeti safari/i,
      });
      await actionsButton.click();

      await page.getByText("Delete").click();

      await expect(
        page.getByRole("heading", { name: "Delete Head Office" })
      ).toBeVisible();
      await expect(
        page.getByText(/this head office will be removed from active use/i)
      ).toBeVisible();
    });

    test("should display Cancel and Delete Head Office buttons in dialog", async ({
      page,
    }) => {
      const actionsButton = page.getByRole("button", {
        name: /actions for serengeti safari/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /delete head office/i })
      ).toBeVisible();
    });

    test("should show reassign warning when head office has suppliers", async ({
      page,
    }) => {
      const actionsButton = page.getByRole("button", {
        name: /actions for elewana collection/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      await expect(page.getByText("Reassign suppliers first")).toBeVisible();
      await expect(
        page.getByText(/this head office contains active suppliers/i)
      ).toBeVisible();
    });
  });

  test.describe("Cancel deletion", () => {
    test("should close delete dialog when Cancel is clicked", async ({
      page,
    }) => {
      const actionsButton = page.getByRole("button", {
        name: /actions for serengeti safari/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      await expect(
        page.getByRole("heading", { name: "Delete Head Office" })
      ).toBeVisible();

      await page.getByRole("button", { name: /cancel/i }).click();

      await expect(
        page.getByRole("heading", { name: "Delete Head Office" })
      ).not.toBeVisible({ timeout: 5000 });
    });

    test("should not remove head office from list after cancelling deletion", async ({
      page,
    }) => {
      const actionsButton = page.getByRole("button", {
        name: /actions for serengeti safari/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      await page.getByRole("button", { name: /cancel/i }).click();

      await expect(
        page.getByRole("heading", { name: "Delete Head Office" })
      ).not.toBeVisible({ timeout: 5000 });

      await expect(page.getByText("Serengeti Safari")).toBeVisible();
    });
  });

  test.describe("Confirm deletion", () => {
    test("should delete head office when Delete Head Office is confirmed", async ({
      page,
    }) => {
      await expect(page.getByText("Serengeti Safari")).toBeVisible();

      const actionsButton = page.getByRole("button", {
        name: /actions for serengeti safari/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      await expect(
        page.getByRole("heading", { name: "Delete Head Office" })
      ).toBeVisible();

      const deleteButton = page.getByRole("button", {
        name: /delete head office/i,
      });
      await deleteButton.click();

      await expect(
        page.getByRole("heading", { name: "Delete Head Office" })
      ).not.toBeVisible({ timeout: 10000 });

      await expect(page.getByText("Serengeti Safari")).not.toBeVisible({
        timeout: 5000,
      });
    });
  });
});
