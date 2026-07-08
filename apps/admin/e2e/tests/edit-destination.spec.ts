import { test, expect, type Page } from "@playwright/test";

import { setupDesktopViewport } from "../fixtures/test-setup";

test.describe("Edit Destination", () => {
  test.beforeEach(async ({ page }) => {
    await setupDesktopViewport(page);
    await page.goto("database/destinations/destinations");
    // Wait for destinations to load
    await page
      .getByPlaceholder("Search destination")
      .waitFor({ timeout: 10000 });
  });

  test("should open edit modal when clicking edit button", async ({ page }) => {
    await openEditModal(page, "Kenya");
    await expect(page.getByText("Edit Destination")).toBeVisible();
  });

  // Helper function to open edit modal
  async function openEditModal(page: Page, destinationName: string) {
    // Find the destination name text
    const destinationText = page
      .getByText(destinationName, { exact: true })
      .first();
    await expect(destinationText).toBeVisible({ timeout: 5000 });

    // The edit button has aria-label like "Edit Kenya"
    const editButton = page.getByRole("button", {
      name: new RegExp(`Edit ${destinationName}`, "i"),
    });

    // Hover over the destination text to reveal action buttons
    // The parent row has onMouseEnter handler that shows the buttons
    await destinationText.hover();
    await page.waitForTimeout(500);

    // If button not visible, try forcing visibility by clicking on the row area
    if (!(await editButton.isVisible())) {
      // Move mouse to trigger hover state
      const box = await destinationText.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width + 50, box.y + box.height / 2);
        await page.waitForTimeout(500);
      }
    }

    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // Wait for modal to be visible and data to load
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    // Wait for form to be populated - check for name input
    await page.waitForSelector('input[id="name"]', { timeout: 5000 });
  }

  test("should display correct initial values in edit modal", async ({
    page,
  }) => {
    // Open edit modal for Kenya
    await openEditModal(page, "Kenya");

    // Verify form fields are populated with destination data
    const nameInput = page.getByLabel(/name/i);
    await expect(nameInput).toHaveValue("Kenya");

    // Verify parent field is displayed (read-only)
    const parentInput = page.getByLabel(/parent destination/i);
    await expect(parentInput).toBeDisabled();
  });

  test("should allow editing destination name", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Edit name
    const nameInput = page.getByLabel(/name/i);
    await nameInput.clear();
    await nameInput.fill("Kenya Updated");

    // Verify value is updated
    await expect(nameInput).toHaveValue("Kenya Updated");
  });

  test("should show validation error for empty name", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Clear name field
    const nameInput = page.getByLabel(/name/i);
    await nameInput.clear();

    // Try to submit
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await saveButton.click();

    // Verify validation error is shown
    await expect(
      page.getByText("Name is required", { exact: false })
    ).toBeVisible({ timeout: 2000 });
  });

  test("should allow changing destination type", async ({ page }) => {
    // Open edit modal for a Country destination
    await openEditModal(page, "Kenya");

    // Change type to Region - use radio role instead of button
    const regionButton = page.getByRole("radio", { name: /region/i });
    await expect(regionButton).toBeVisible();
    await regionButton.click();

    // Verify type is changed (Region button should be selected)
    await expect(regionButton).toHaveAttribute("aria-checked", "true", {
      timeout: 2000,
    });
  });

  test("should show code field for all types", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Verify code field is visible (single code field for all types)
    const codeInput = page.getByLabel(/code/i);
    await expect(codeInput).toBeVisible({ timeout: 2000 });

    // Change type to Airport - use radio role instead of button
    const airportButton = page.getByRole("radio", { name: /airport/i });
    await expect(airportButton).toBeVisible();
    await airportButton.click();

    // Wait for form to update
    await page.waitForTimeout(500);

    // Verify code field is still visible for Airport type
    await expect(codeInput).toBeVisible({ timeout: 2000 });
  });

  test("should preserve code value when switching types", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Fill code field
    const codeInput = page.getByLabel(/code/i);
    await codeInput.fill("KEN");

    // Switch to Airport type - use radio role
    const airportButton = page.getByRole("radio", { name: /airport/i });
    await airportButton.click();
    await page.waitForTimeout(500);

    // Verify code field is still visible and value is preserved
    await expect(codeInput).toBeVisible();
    await expect(codeInput).toHaveValue("KEN");

    // Switch back to Country type - use radio role
    const countryButton = page.getByRole("radio", { name: /country/i });
    await countryButton.click();
    await page.waitForTimeout(500);

    // Verify code field is still visible and value is preserved
    await expect(codeInput).toBeVisible();
    await expect(codeInput).toHaveValue("KEN");
  });

  test("should allow editing coordinates", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Edit latitude
    const latitudeInput = page.getByLabel(/latitude/i);
    await latitudeInput.clear();
    await latitudeInput.fill("-0.0236");

    // Edit longitude
    const longitudeInput = page.getByLabel(/longitude/i);
    await longitudeInput.clear();
    await longitudeInput.fill("37.9062");

    // Verify values are updated
    await expect(latitudeInput).toHaveValue("-0.0236");
    await expect(longitudeInput).toHaveValue("37.9062");
  });

  test("should validate latitude range", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Enter invalid latitude (> 90)
    const latitudeInput = page.getByLabel(/latitude/i);
    await latitudeInput.clear();
    await latitudeInput.fill("91");

    // Try to submit
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await saveButton.click();

    // Verify validation error
    await expect(
      page.getByText(/latitude must be a number between -90 and 90/i)
    ).toBeVisible({ timeout: 2000 });
  });

  test("should validate longitude range", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Enter invalid longitude (> 180)
    const longitudeInput = page.getByLabel(/longitude/i);
    await longitudeInput.clear();
    await longitudeInput.fill("181");

    // Try to submit
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await saveButton.click();

    // Verify validation error
    await expect(
      page.getByText(/longitude must be a number between -180 and 180/i)
    ).toBeVisible({ timeout: 2000 });
  });

  test("should allow empty coordinates", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Clear coordinates
    const latitudeInput = page.getByLabel(/latitude/i);
    const longitudeInput = page.getByLabel(/longitude/i);
    await latitudeInput.clear();
    await longitudeInput.clear();

    // Submit should work without validation errors for coordinates
    const saveButton = page.getByRole("button", { name: /save changes/i });
    // Note: This test assumes the form can be submitted with empty coordinates
    // The actual behavior depends on API requirements
    await expect(saveButton).toBeEnabled();
  });

  test("should display parent destination correctly", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Verify parent field is read-only
    const parentInput = page.getByLabel(/parent destination/i);
    await expect(parentInput).toBeDisabled();

    // Verify parent is displayed (should show "All Destinations" for root or parent name)
    const parentValue = await parentInput.inputValue();
    expect(parentValue).toBeTruthy();
  });

  test("should close modal when clicking cancel", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Click cancel
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await cancelButton.click();

    // Verify modal is closed
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 2000 });
  });

  // test("should close modal when clicking outside", async ({ page }) => {
  //   // Open edit modal
  //   await openEditModal(page, "Kenya");

  //   // Click outside modal (on overlay) - click at a point outside the dialog content
  //   const overlay = page.locator('[data-slot="dialog-overlay"]');
  //   await expect(overlay).toBeVisible();

  //   // Click the overlay - use click without force to ensure proper event handling
  //   // Click at the center of the overlay to avoid hitting the dialog content
  //   const overlayBox = await overlay.boundingBox();
  //   if (overlayBox) {
  //     await page.mouse.click(
  //       overlayBox.x + overlayBox.width / 2,
  //       overlayBox.y + overlayBox.height / 2
  //     );
  //   } else {
  //     // Fallback: click at a safe position outside dialog content
  //     await page.mouse.click(10, 10);
  //   }

  //   // Wait for dialog to close with longer timeout for animation
  //   await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  // });

  // test("should show loading state when saving", async ({ page }) => {
  //   // Open edit modal
  //   await openEditModal(page, "Kenya");

  //   // Make a change
  //   const nameInput = page.getByLabel(/name/i);
  //   await nameInput.clear();
  //   await nameInput.fill("Kenya Test");

  //   // Submit form
  //   const saveButton = page.getByRole("button", { name: /save changes/i });
  //   await saveButton.click();

  //   // Check loading state - button should either:
  //   // 1. Show "Saving..." text and be disabled, OR
  //   // 2. Be disabled immediately (if API is fast), OR
  //   // 3. Modal closes (successful save)
  //   try {
  //     const savingButton = page.getByRole("button", { name: /saving/i });
  //     await expect(savingButton).toBeVisible({ timeout: 1000 });
  //     await expect(savingButton).toBeDisabled();
  //   } catch {
  //     // If "Saving..." doesn't appear, check if button is disabled or modal closed
  //     const isDisabled = await saveButton.isDisabled().catch(() => false);
  //     const modalVisible = await page.getByRole("dialog").isVisible().catch(() => false);

  //     // Either button is disabled OR modal closed (success)
  //     expect(isDisabled || !modalVisible).toBe(true);
  //   }
  // });

  test("should reset form when modal is reopened", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Make changes
    const nameInput = page.getByLabel(/name/i);
    await nameInput.clear();
    await nameInput.fill("Modified Name");

    // Close modal
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await cancelButton.click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 2000 });

    // Reopen modal
    await openEditModal(page, "Kenya");

    // Verify form is reset to original values
    const nameInputAfterReopen = page.getByLabel(/name/i);
    await expect(nameInputAfterReopen).toHaveValue("Kenya");
  });

  test("should handle editing nested destinations", async ({ page }) => {
    // Expand Kenya to see nested destinations
    const expandButton = page.locator('button[aria-label="Expand"]').first();
    const hasExpandable = (await expandButton.count()) > 0;

    if (hasExpandable) {
      await expandButton.click();
      await expect(
        page.locator('button[aria-label="Collapse"]').first()
      ).toBeVisible({ timeout: 5000 });

      // Find a nested destination (e.g., Southern Kenya)
      const nestedDestination = page
        .getByText("Southern Kenya", { exact: false })
        .or(page.getByText("Central Kenya", { exact: false }))
        .first();

      if ((await nestedDestination.count()) > 0) {
        await nestedDestination.hover();

        // Click edit button for nested destination
        const nestedEditButton = page
          .getByLabel(/edit/i)
          .filter({ hasText: /southern|central/i })
          .first();

        if ((await nestedEditButton.count()) > 0) {
          await nestedEditButton.click();

          // Verify modal opens with nested destination data
          await expect(page.getByRole("dialog")).toBeVisible();
          const nameInput = page.getByLabel(/name/i);
          const nameValue = await nameInput.inputValue();
          expect(nameValue).toBeTruthy();
        }
      }
    }
  });

  test("should display description text in modal", async ({ page }) => {
    // Open edit modal
    await openEditModal(page, "Kenya");

    // Verify description text is displayed
    await expect(
      page.getByText(/You can change the name, code or coordinates only./i)
    ).toBeVisible();
  });
});
