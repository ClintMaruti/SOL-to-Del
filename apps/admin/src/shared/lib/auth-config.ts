/**
 * Authentication configuration helper
 * Provides functions to construct backend authentication URLs
 */

import { ROUTES } from "@/shared/lib/paths";

/**
 * Get the backend base URL from VITE_API_BASE_URL
 * Strips /api suffix if present to get the base URL
 * Since all API endpoints now include /api in their paths, the base URL should not include /api
 * @returns Backend base URL (absolute URL required for new URL() constructor)
 * @throws Error if VITE_API_BASE_URL is not set and we're not in a browser context
 */
export function getBackendBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  if (!apiUrl) {
    // If not set, try to use current origin (for same-origin API)
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    throw new Error(
      "VITE_API_BASE_URL must be set. Set it in your .env file or CI/CD variables."
    );
  }

  // If it's a relative path, use current origin (for same-origin API behind CloudFront)
  if (apiUrl.startsWith("/")) {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    throw new Error(
      "VITE_API_BASE_URL is a relative path but window is not available. Use an absolute URL or ensure this runs in browser context."
    );
  }

  // Remove /api suffix if present (for backwards compatibility)
  // This ensures URLs like /api/auth/login are constructed correctly
  if (apiUrl.endsWith("/api")) {
    return apiUrl.slice(0, -4);
  }

  return apiUrl;
}

/**
 * Get the full frontend URL for a given path
 * Uses VITE_FRONTEND_BASE_URL if set, otherwise detects from window.location
 * This ensures returnUrl always points to the frontend (not backend)
 * @param path - Path to append to frontend base URL (e.g., "/login", "/database/destinations")
 *               Note: React Router strips the base path, so paths from location.pathname won't include /admin/
 * @returns Full frontend URL with base path included
 */
export function getFrontendUrl(path: string): string {
  // Get frontend base URL
  // Use environment variable if set (for production builds)
  let baseUrl: string;
  if (import.meta.env.VITE_FRONTEND_BASE_URL) {
    baseUrl = import.meta.env.VITE_FRONTEND_BASE_URL;
  } else if (typeof window !== "undefined") {
    // In browser, detect from current location
    baseUrl = window.location.origin;
  } else {
    // This is an SPA, so window should always be available
    // If not, throw an error to catch configuration issues
    throw new Error(
      "VITE_FRONTEND_BASE_URL must be set when window is not available. This should not happen in an SPA."
    );
  }

  // Get Vite base path (e.g., "/admin/")
  const viteBasePath = import.meta.env.BASE_URL || "/";

  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const appBaseSegment = viteBasePath.replace(/\/$/, "") || "";
  const baseNoTrailingSlash = baseUrl.replace(/\/+$/, "");

  // If VITE_FRONTEND_BASE_URL already ends with /admin (with or without trailing slash),
  // do not prepend /admin again — otherwise URLs become .../admin/admin/...
  const baseUrlAlreadyHasAppPath =
    viteBasePath !== "/" && baseNoTrailingSlash.endsWith(appBaseSegment);

  if (baseUrlAlreadyHasAppPath) {
    return `${baseNoTrailingSlash}${normalizedPath}`;
  }

  const basePathWithoutTrailing = viteBasePath.replace(/\/$/, "");
  return `${baseNoTrailingSlash}${basePathWithoutTrailing}${normalizedPath}`;
}

/**
 * Strip Vite `base` (e.g. `/admin/`) from a URL pathname so React Router paths match `basename`.
 * When `BASE_URL` is `/` (e.g. some test runners), fall back to stripping a leading `/admin` segment.
 */
function stripRouterBaseFromPathname(pathname: string): string {
  const viteBasePath = import.meta.env.BASE_URL || "/";
  let out = pathname;
  if (viteBasePath !== "/" && out.startsWith(viteBasePath)) {
    out = out.slice(viteBasePath.length - 1);
  } else if (out.startsWith("/admin/") || out === "/admin") {
    out = out === "/admin" ? "/" : out.slice("/admin".length);
  }
  // Mis-built return URLs can contain /admin/admin/...; strip duplicate leading /admin
  while (out.startsWith("/admin/")) {
    out = out.slice("/admin".length);
  }
  if (out === "/admin") {
    out = "/";
  }
  return out;
}

/**
 * Convert a full frontend URL (e.g. from ?returnUrl= on the login page) to a React Router
 * location string: pathname + search, with the Vite base path stripped (e.g. "/database/...").
 * Matches the logic used when redirecting after OAuth in PublicRoute.
 */
export function getAppPathFromFrontendUrl(fullUrl: string): string {
  try {
    const url = new URL(fullUrl);
    const pathname = stripRouterBaseFromPathname(url.pathname);
    let out = pathname + url.search;
    if (out === "/" || out === "") {
      out = ROUTES.DESTINATIONS;
    }
    return out;
  } catch {
    const raw = fullUrl.startsWith("/") ? fullUrl : `/${fullUrl}`;
    const qIndex = raw.indexOf("?");
    const pathOnly = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
    const search = qIndex >= 0 ? raw.slice(qIndex) : "";
    const path = stripRouterBaseFromPathname(pathOnly);
    if (path === "/" || path === "") {
      return ROUTES.DESTINATIONS;
    }
    return path + search;
  }
}

/**
 * Get the return URL path for the backend (path only, e.g. "/admin" or "/admin/login").
 * BE expects returnUrl as a path, not a full URL.
 * @param appPath - App path without base (e.g., "/login", "/database/destinations")
 * @returns Path including base (e.g., "/admin/login", "/admin/database/destinations")
 */
export function getReturnUrlPath(appPath: string): string {
  const viteBasePath = import.meta.env.BASE_URL || "/";
  const basePathWithoutTrailing = viteBasePath.replace(/\/$/, "") || "";
  const normalizedPath = appPath.startsWith("/") ? appPath : `/${appPath}`;
  return `${basePathWithoutTrailing}${normalizedPath}`;
}

/**
 * Get the login URL with optional returnUrl parameter (path only, e.g. ?returnUrl=/admin)
 * @param returnUrlPath - Optional app path (e.g. "/login", "/database/destinations"). Converted to path with base (e.g. "/admin/login").
 * @returns Login URL (always uses backend URL directly)
 */
export function getLoginUrl(returnUrlPath?: string): string {
  const url = new URL("/api/auth/login", getBackendBaseUrl());
  if (returnUrlPath) {
    url.searchParams.set("returnUrl", getReturnUrlPath(returnUrlPath));
  }
  return url.toString();
}

/**
 * Get the logout URL with optional returnUrl for BE to redirect after logout (path only, e.g. ?returnUrl=/admin)
 * @param returnUrlPath - Optional path (e.g. "/admin"). Passed as-is to the backend.
 * @returns Logout URL (always uses backend URL directly)
 */
export function getLogoutUrl(returnUrlPath?: string): string {
  const url = new URL("/api/auth/logout", getBackendBaseUrl());
  if (returnUrlPath) {
    url.searchParams.set("returnUrl", returnUrlPath);
  }
  return url.toString();
}
