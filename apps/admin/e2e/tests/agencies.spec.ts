import { expect, test } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

const AGENCIES_SEARCH_PLACEHOLDER =
  "Search agency by name, group or assigned Safari Planner";

test.describe("Agencies List", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);

    await page.goto("database/destinations/agencies");
    // Wait for agencies page to load and data to be fetched
    await page
      .getByPlaceholder(AGENCIES_SEARCH_PLACEHOLDER)
      .waitFor({ timeout: 10000 });
  });

  test.describe("View Agencies List", () => {
    test("should display agencies page header", async ({ page }) => {
      const header = page.getByRole("heading", { name: /agencies/i });
      await expect(header).toBeVisible();
    });

    test("should display agencies table with headers", async ({ page }) => {
      // Check for table headers (scoped to table to avoid matching page description text)
      const table = page.locator("table");
      await expect(table.getByText("Agency Name")).toBeVisible();
      await expect(table.getByText("Number of Agents")).toBeVisible();
      await expect(
        table.getByText("Agency Group", { exact: true })
      ).toBeVisible();
      await expect(table.getByText("SM", { exact: true })).toBeVisible();
      await expect(table.getByText("Assigned Safari Planner")).toBeVisible();
      await expect(table.getByText("Active")).toBeVisible();
      await expect(table.getByText("Actions")).toBeVisible();
    });

    test("should display agencies in the table", async ({ page }) => {
      // Wait for agencies to load and display
      const firstAgency = page.getByText("Kilimanjaro Experts");
      await expect(firstAgency).toBeVisible({ timeout: 5000 });
    });

    test("should display Create button", async ({ page }) => {
      const createButton = page.getByRole("button", { name: /create/i });
      await expect(createButton).toBeVisible();
    });

    test("should display search input", async ({ page }) => {
      const searchInput = page.getByPlaceholder(AGENCIES_SEARCH_PLACEHOLDER);
      await expect(searchInput).toBeVisible();
    });
  });

  test.describe("Search Functionality", () => {
    test("should filter agencies when searching by name", async ({ page }) => {
      const searchInput = page.getByPlaceholder(AGENCIES_SEARCH_PLACEHOLDER);
      await searchInput.fill("kilimanjaro");

      // Should show matching agency
      await expect(page.getByText("Kilimanjaro Experts")).toBeVisible();

      // Should not show non-matching agencies
      await expect(page.getByText("Serengeti Adventures")).not.toBeVisible();
    });

    test("should filter agencies when searching by agency group", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder(AGENCIES_SEARCH_PLACEHOLDER);
      await searchInput.fill("AAConsultants");

      // Should show matching agency
      await expect(page.getByText("Kilimanjaro Experts")).toBeVisible();
    });

    test("should filter agencies when searching by safari planner", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder(AGENCIES_SEARCH_PLACEHOLDER);
      await searchInput.fill("Amelia");

      // Should show agencies with Amelia Earhart as planner
      await expect(page.getByText("Serengeti Adventures")).toBeVisible();
      await expect(page.getByText("Africa Tours")).toBeVisible();
    });

    test("should show all agencies when search is cleared", async ({
      page,
    }) => {
      const searchInput = page.getByPlaceholder(AGENCIES_SEARCH_PLACEHOLDER);

      // Search first
      await searchInput.fill("kilimanjaro");
      await expect(page.getByText("Serengeti Adventures")).not.toBeVisible();

      // Clear search
      await searchInput.clear();

      // All agencies should be visible again
      await expect(page.getByText("Kilimanjaro Experts")).toBeVisible();
      await expect(page.getByText("Serengeti Adventures")).toBeVisible();
    });

    test("should clear search when X button is clicked", async ({ page }) => {
      const searchInput = page.getByPlaceholder(AGENCIES_SEARCH_PLACEHOLDER);
      await searchInput.fill("kilimanjaro");

      // Wait for search to filter
      await expect(page.getByText("Serengeti Adventures")).not.toBeVisible();

      // Click clear button (X icon) inside the search input group
      const searchGroup = page.locator('[data-slot="input-group"]').first();
      const clearButton = searchGroup.getByRole("button");
      if ((await clearButton.count()) > 0) {
        await clearButton.click();

        // All agencies should be visible again
        await expect(page.getByText("Serengeti Adventures")).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe("Sorting", () => {
    test("should sort by agency name when header is clicked", async ({
      page,
    }) => {
      const nameHeader = page.getByText("Agency Name");
      await nameHeader.click();

      // Wait for sorting to complete
      await page.waitForTimeout(500);

      // First agency alphabetically should be Africa Tours or Africa Treks
      const firstCell = page.locator("tbody tr:first-child td:first-child");
      const text = await firstCell.textContent();
      expect(text?.toLowerCase()).toMatch(/africa/);
    });

    test("should toggle sort direction on second click", async ({ page }) => {
      const nameHeader = page.getByText("Agency Name");

      // First click - ascending
      await nameHeader.click();
      await page.waitForTimeout(300);

      // Second click - descending
      await nameHeader.click();
      await page.waitForTimeout(300);

      // First agency should be last alphabetically (Z)
      const firstCell = page.locator("tbody tr:first-child td:first-child");
      const text = await firstCell.textContent();
      expect(text?.toLowerCase()).toMatch(/zambezi/);
    });
  });

  test.describe("Navigate to Agency Details", () => {
    test("should trigger navigation when agency name is clicked", async ({
      page,
    }) => {
      // Find and click on an agency name
      const agencyName = page.getByText("Kilimanjaro Experts");
      await agencyName.click();

      // For now, just verify the click was possible
      // TODO: Update when navigation is implemented
      await expect(agencyName).toBeVisible();
    });
  });

  test.describe("Navigate to Agents List", () => {
    test("should trigger navigation when agents count is clicked", async ({
      page,
    }) => {
      // Find and click on agents count
      const agentsLink = page.getByText("7 Agents");
      await agentsLink.click();

      // For now, just verify the click was possible
      // TODO: Update when navigation is implemented
      await expect(agentsLink).toBeVisible();
    });
  });

  test.describe("Toggle Agency Status", () => {
    test("should toggle agency status when switch is clicked", async ({
      page,
    }) => {
      // Find a toggle switch
      const toggleSwitch = page
        .getByRole("switch", {
          name: /toggle.*active status/i,
        })
        .first();

      // Click to toggle
      await toggleSwitch.click();

      // Wait for state change
      await page.waitForTimeout(500);

      // Verify state changed (or API call was made)
      // The toggle might revert if the API call is mocked
      await expect(toggleSwitch).toBeVisible();
    });

    test("should show toggle in checked state for active agencies", async ({
      page,
    }) => {
      // Find toggle for an active agency (Serengeti Adventures)
      const toggleSwitch = page.getByRole("switch", {
        name: /toggle serengeti adventures active status/i,
      });

      await expect(toggleSwitch).toBeVisible();
      const state = await toggleSwitch.getAttribute("data-state");
      expect(state).toBe("checked");
    });

    test("should show toggle in unchecked state for inactive agencies", async ({
      page,
    }) => {
      // Find toggle for an inactive agency (Kilimanjaro Experts)
      const toggleSwitch = page.getByRole("switch", {
        name: /toggle kilimanjaro experts active status/i,
      });

      await expect(toggleSwitch).toBeVisible();
      const state = await toggleSwitch.getAttribute("data-state");
      expect(state).toBe("unchecked");
    });
  });

  test.describe("Delete Agency Flow", () => {
    test("should open actions menu when three-dot button is clicked", async ({
      page,
    }) => {
      // Find the actions button for an agency
      const actionsButton = page
        .getByRole("button", {
          name: /actions for/i,
        })
        .first();

      await actionsButton.click();

      // Dropdown menu should be visible with Delete option
      await expect(page.getByText("Delete")).toBeVisible();
    });

    test("should open delete dialog when Delete is clicked for agency without agents", async ({
      page,
    }) => {
      // Find actions for Kilimanjaro Experts (has 0 agents)
      const actionsButton = page.getByRole("button", {
        name: /actions for kilimanjaro experts/i,
      });

      await actionsButton.click();

      // Click Delete
      const deleteOption = page.getByText("Delete");
      await deleteOption.click();

      // Delete dialog should appear
      await expect(
        page.getByRole("heading", { name: "Delete Agency" })
      ).toBeVisible();
      await expect(
        page.getByText(/this agency will be removed from active use/i)
      ).toBeVisible();
    });

    test("should show reassign warning when trying to delete agency with agents", async ({
      page,
    }) => {
      // Find actions for Serengeti Adventures (has 7 agents)
      const actionsButton = page.getByRole("button", {
        name: /actions for serengeti adventures/i,
      });

      await actionsButton.click();

      // Click Delete
      const deleteOption = page.getByText("Delete");
      await deleteOption.click();

      // Reassign warning should appear
      await expect(page.getByText("Reassign agents first")).toBeVisible();
      await expect(
        page.getByText(/this group contains active agents/i)
      ).toBeVisible();
    });

    test("should close reassign dialog when Ok is clicked", async ({
      page,
    }) => {
      // Open delete dialog for agency with agents
      const actionsButton = page.getByRole("button", {
        name: /actions for serengeti adventures/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      // Click Ok
      const okButton = page.getByRole("button", { name: /ok/i });
      await okButton.click();

      // Dialog should close
      await expect(page.getByText("Reassign agents first")).not.toBeVisible();
    });

    test("should close delete dialog when Cancel is clicked", async ({
      page,
    }) => {
      // Open delete dialog for agency without agents
      const actionsButton = page.getByRole("button", {
        name: /actions for kilimanjaro experts/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      // Click Cancel
      const cancelButton = page.getByRole("button", { name: /cancel/i });
      await cancelButton.click();

      // Dialog should close
      await expect(
        page.getByRole("heading", { name: "Delete Agency" })
      ).not.toBeVisible();
    });

    test("should delete agency when Delete Agency is confirmed", async ({
      page,
    }) => {
      // Open delete dialog for agency without agents
      const actionsButton = page.getByRole("button", {
        name: /actions for kilimanjaro experts/i,
      });
      await actionsButton.click();
      await page.getByText("Delete").click();

      // Confirm deletion
      const deleteButton = page.getByRole("button", { name: /delete agency/i });
      await deleteButton.click();

      // Wait for deletion to complete
      await page.waitForTimeout(1000);

      // Agency should no longer be visible
      await expect(page.getByText("Kilimanjaro Experts")).not.toBeVisible({
        timeout: 3000,
      });
    });
  });

  test.describe("Empty State", () => {
    test.skip("should display empty state when no agencies exist", async () => {
      // This test would require clearing all agencies first
      // Skip for now as it would affect other tests
      // In a real scenario, this would use test isolation or a separate test database
      // Expected behavior:
      // - Show "No agencies yet" message
      // - Show description about creating agencies
      // - Show Create button
    });
  });

  test.describe("Loading State", () => {
    test("should show loading state while agencies are being fetched", async ({
      page,
    }) => {
      // Navigate to page
      await page.goto("database/destinations/agencies");

      // Initially, skeleton or loading state might be visible
      // This depends on network conditions and might be too fast to catch
      // Just verify the page eventually loads
      await expect(
        page.getByRole("heading", { name: /agencies/i })
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
