import { ApiError, messageFromResponseBody } from "./api-client";

export interface ValidationResult {
  message: string;
  errors: Record<string, string[]>;
}

/**
 * Get validation errors from an error if it's a 400/422 response with errors
 * @returns ValidationResult or null if not a validation error
 */
export function getValidationErrors(error: unknown): ValidationResult | null {
  if (!ApiError.isApiError(error)) {
    return null;
  }

  if (!error.isValidationError() || !error.validationErrors) {
    return null;
  }

  return {
    message: error.message,
    errors: error.validationErrors,
  };
}

/**
 * Get first error for a specific field (case-insensitive)
 */
export function getFieldError(
  errors: Record<string, string[]>,
  fieldName: string
): string | undefined {
  // Try exact match first, then case-insensitive
  const key = Object.keys(errors).find(
    (k) => k === fieldName || k.toLowerCase() === fieldName.toLowerCase()
  );
  return key ? errors[key]?.[0] : undefined;
}

/**
 * Convert validation errors to form-compatible map (first error per field, camelCase keys)
 */
export function toFormErrors(
  errors: Record<string, string[]>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(errors)) {
    if (messages.length > 0) {
      // Convert PascalCase to camelCase
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      result[camelKey] = messages[0];
    }
  }
  return result;
}

/**
 * Get a user-friendly error message from any error.
 * For validation errors, returns the first field error.
 * For other errors, returns the error message or a fallback.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "An error occurred"
): string {
  const validation = getValidationErrors(error);
  if (validation) {
    const firstFieldErrors = Object.values(validation.errors)[0];
    return firstFieldErrors?.[0] ?? validation.message;
  }

  if (ApiError.isApiError(error)) {
    const fromBody = messageFromResponseBody(error.data);
    if (fromBody) {
      return fromBody;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
