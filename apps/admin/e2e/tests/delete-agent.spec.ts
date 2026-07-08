import { expect, test } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const agentsPath = "database/destinations/agents";

test.describe("Delete Agent", () => {
  let table: ReturnType<(typeof test)["info"]> extends never
    ? never
    : ReturnType<ReturnType<typeof expect>["locator"]>;

  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto(agentsPath);
    await page
      .getByPlaceholder(
        "Search agent by name, agency, group, email or assigned Safari Planner"
      )
      .waitFor({ timeout: 10000 });
  });

  test.describe("Delete Dialog Opening", () => {
    test("should open delete dialog when Delete is clicked from actions menu", async ({
      page,
    }) => {
      const actionsButton = page.getByRole("button", {
        name: /actions for gugu mbatha-raw/i,
      });
      await actionsButton.click();

      await page.getByText("Delete").click();

      await expect(
        page.getByRole("heading", { name: "Delete Agent" })
      ).toBeVisible();
      await expect(
        page.getByText(/this agent will be removed from active use/i)
      ).toBeVisible();
    });

    test("should display Cancel and Delete Agent buttons in dialog", async ({
      page,
    }) => {
      const actionsButton = page.getByRole("button", {
        name: /actions for gugu mbatha-raw/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /delete agent/i })
      ).toBeVisible();
    });

    test("should open actions menu when three-dot button is clicked", async ({
      page,
    }) => {
      const actionsButton = page.getByRole("button", {
        name: /actions for jomo kenyatta/i,
      });
      await actionsButton.click();

      await expect(page.getByText("Delete")).toBeVisible();
    });
  });

  test.describe("Cancel Deletion", () => {
    test("should close delete dialog when Cancel is clicked", async ({
      page,
    }) => {
      const actionsButton = page.getByRole("button", {
        name: /actions for gugu mbatha-raw/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      await expect(
        page.getByRole("heading", { name: "Delete Agent" })
      ).toBeVisible();

      await page.getByRole("button", { name: /cancel/i }).click();

      await expect(
        page.getByRole("heading", { name: "Delete Agent" })
      ).not.toBeVisible({ timeout: 5000 });
    });

    test("should not remove agent from list after cancelling deletion", async ({
      page,
    }) => {
      const actionsButton = page.getByRole("button", {
        name: /actions for gugu mbatha-raw/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      await page.getByRole("button", { name: /cancel/i }).click();

      await expect(
        page.getByRole("heading", { name: "Delete Agent" })
      ).not.toBeVisible({ timeout: 5000 });

      await expect(page.getByText("Gugu Mbatha-Raw")).toBeVisible();
    });
  });

  test.describe("Confirm Deletion", () => {
    test("should delete agent when Delete Agent is confirmed", async ({
      page,
    }) => {
      // Verify agent exists before deletion
      await expect(page.getByText("Gugu Mbatha-Raw")).toBeVisible();

      const actionsButton = page.getByRole("button", {
        name: /actions for gugu mbatha-raw/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      await expect(
        page.getByRole("heading", { name: "Delete Agent" })
      ).toBeVisible();

      const deleteButton = page.getByRole("button", {
        name: /delete agent/i,
      });
      await deleteButton.click();

      // Dialog should close
      await expect(
        page.getByRole("heading", { name: "Delete Agent" })
      ).not.toBeVisible({ timeout: 10000 });

      // Agent should be removed from the list
      await expect(page.getByText("Gugu Mbatha-Raw")).not.toBeVisible({
        timeout: 5000,
      });
    });

    test("should remove deleted agent from the table", async ({ page }) => {
      // Delete Jomo Kenyatta
      const actionsButton = page.getByRole("button", {
        name: /actions for jomo kenyatta/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      await page.getByRole("button", { name: /delete agent/i }).click();

      await expect(
        page.getByRole("heading", { name: "Delete Agent" })
      ).not.toBeVisible({ timeout: 10000 });

      await expect(page.getByText("Jomo Kenyatta")).not.toBeVisible({
        timeout: 5000,
      });

      // Other agents should still be visible
      await expect(page.getByText("Jonathan Annan")).toBeVisible();
    });
  });

  test.describe("Delete Different Agents", () => {
    test("should be able to delete different agents sequentially", async ({
      page,
    }) => {
      // Delete first agent
      const firstActionsButton = page.getByRole("button", {
        name: /actions for gugu mbatha-raw/i,
      });
      await firstActionsButton.click();
      await page.getByText("Delete").click();
      await page.getByRole("button", { name: /delete agent/i }).click();

      await expect(page.getByText("Gugu Mbatha-Raw")).not.toBeVisible({
        timeout: 10000,
      });

      // Delete second agent
      const secondActionsButton = page.getByRole("button", {
        name: /actions for jomo kenyatta/i,
      });
      await secondActionsButton.click();
      await page.getByText("Delete").click();
      await page.getByRole("button", { name: /delete agent/i }).click();

      await expect(page.getByText("Jomo Kenyatta")).not.toBeVisible({
        timeout: 10000,
      });

      // Remaining agents should still be visible
      await expect(page.getByText("Jonathan Annan")).toBeVisible();
    });
  });
});
