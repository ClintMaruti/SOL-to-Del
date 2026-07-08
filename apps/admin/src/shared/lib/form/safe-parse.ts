import type { ZodError } from "zod";

/**
 * Returns top-level field names that have validation errors.
 * Used to scroll to the first section with an error when zod validation fails.
 */
export function getFieldNamesFromZodError(error: ZodError): string[] {
  const names = new Set<string>();
  for (const issue of error.issues) {
    const first = issue.path[0];
    if (typeof first === "string") names.add(first);
  }
  return Array.from(names);
}

export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ZodError; message: string };

function uniqueMessages(messages: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const message of messages) {
    if (typeof message !== "string") continue;
    if (seen.has(message)) continue;

    seen.add(message);
    result.push(message);
  }

  return result;
}

/**
 * Wraps `schema.safeParse()` so Zod validation failures never throw.
 *
 * Returns a discriminated union:
 * - `{ success: true, data }` — parsed & transformed output
 * - `{ success: false, error, message }` — the raw ZodError plus a
 *   human-readable summary built from `error.flatten()`
 */
export function safeParseSubmitData<TOutput>(
  schema: {
    safeParse: (data: unknown) => {
      success: boolean;
      data?: TOutput;
      error?: ZodError;
    };
  },
  data: unknown
): SafeParseResult<TOutput> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data as TOutput };
  }

  const error = result.error as ZodError;
  const flat = error.flatten();
  const message =
    uniqueMessages([
      ...flat.formErrors,
      ...Object.values(flat.fieldErrors).flat(),
    ]).join("; ") ||
    "Form data is invalid. Please review your input and try again.";

  return { success: false, error, message };
}
