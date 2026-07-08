/**
 * Routing utility functions for generating and parsing route paths
 */

export interface RouteSegments {
  mainItemId: string | null;
  childId: string | null;
  innerPageId: string | null;
}

/**
 * Generate a route path from route segments
 * @param mainItemId - Main sidebar item ID (e.g., "database")
 * @param childId - Optional child item ID (e.g., "destinations")
 * @param innerPageId - Optional inner page ID (e.g., "agency-groups")
 * @returns Route path (e.g., "/database/destinations/agency-groups")
 */
export function generateRoutePath(
  mainItemId: string,
  childId?: string | null,
  innerPageId?: string | null
): string {
  if (!mainItemId) return "/";

  let path = `/${mainItemId}`;

  if (childId) {
    path += `/${childId}`;
  }

  if (innerPageId) {
    path += `/${innerPageId}`;
  }

  return path;
}

/**
 * Parse a route pathname to extract route segments
 * @param pathname - URL pathname (e.g., "/database/destinations/agency-groups")
 * @returns Route segments object
 */
export function parseRoutePath(pathname: string): RouteSegments {
  // Remove leading slash and split
  const segments = pathname.split("/").filter(Boolean);

  return {
    mainItemId: segments[0] || null,
    childId: segments[1] || null,
    innerPageId: segments[2] || null,
  };
}

/**
 * Normalize a string to URL-friendly kebab-case
 * @param str - String to normalize
 * @returns Normalized string in kebab-case
 */
export function normalizeToKebabCase(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
}
