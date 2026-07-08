import { test, expect } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

test.describe("Create Agent", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto("database/destinations/agents");
    // Wait for the page heading to be visible (indicates page loaded)
    await expect(page.getByText("Agents").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("should navigate to create agent page", async ({ page }) => {
    // Click Create button
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/agents\/create/, { timeout: 10000 });

    // Verify page loaded
    await expect(
      page.getByRole("heading", { name: "Create New Agent" })
    ).toBeVisible();
    await expect(
      page.getByText("Newly created agent will be active by default")
    ).toBeVisible();
  });

  test("should display all required form fields", async ({ page }) => {
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/agents\/create/, { timeout: 10000 });

    // Verify all required form fields are visible
    await expect(page.getByLabel("First Name")).toBeVisible();
    await expect(page.getByLabel("Last Name")).toBeVisible();
    await expect(page.getByLabel("Agency")).toBeVisible();
    await expect(page.getByLabel(/^Email/)).toBeVisible();
    await expect(page.getByLabel("Assigned SP")).toBeVisible();
  });

  test("should show validation errors for required fields", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/agents\/create/, { timeout: 10000 });

    // Try to submit without filling fields
    await page.getByRole("button", { name: "Save New Agent" }).first().click();

    // Verify validation errors (case insensitive)
    await expect(page.getByText(/first name is required/i)).toBeVisible();
    await expect(page.getByText(/last name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test("should show unsaved changes dialog when navigating away with dirty form", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/agents\/create/, { timeout: 10000 });

    // Fill in some fields to make form dirty
    await page.getByLabel("First Name").fill("John");
    await page.getByLabel("Last Name").fill("Doe");

    // Try to navigate away by clicking Cancel
    await page.getByRole("button", { name: "Cancel" }).first().click();

    // Verify unsaved changes dialog appears
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    // Dialog should have Leave without saving button
    await expect(
      page.getByRole("button", { name: /leave without saving/i })
    ).toBeVisible();
  });

  test("should navigate directly when form is pristine", async ({ page }) => {
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/agents\/create/, { timeout: 10000 });

    // Click Cancel without making changes
    await page.getByRole("button", { name: "Cancel" }).first().click();

    // Should navigate directly without dialog
    await page.waitForURL(/destinations\/agents$/, { timeout: 10000 });
  });
});
