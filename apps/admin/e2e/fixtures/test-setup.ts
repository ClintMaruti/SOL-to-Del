import { Page } from "@playwright/test";

/**
 * Common test setup for admin app
 * Sets desktop viewport and navigates to home page
 */
export async function setupDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("./");
}
