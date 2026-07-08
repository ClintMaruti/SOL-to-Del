import { z } from "zod";

/**
 * Validates that a string is either empty or a valid URL.
 * Accepts URLs with or without protocol (adds https:// when missing).
 */
export function isOptionalValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const toTest = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    new URL(toTest);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reusable optional URL schema for form fields like website, file link, etc.
 * Accepts empty string; when non-empty, validates as URL.
 *
 * @param message - Error message when URL is invalid (use i18n for translations)
 */
export function optionalUrlSchema(message: string) {
  return z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .refine((val) => !val || isOptionalValidUrl(val), { message }),
  ]);
}
