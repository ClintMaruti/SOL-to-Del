import { ApiError, getValidationErrors } from "@sol/api-client";

export function isMarginRuleDuplicateError(error: unknown): boolean {
  if (ApiError.isApiError(error) && error.status === 409) {
    return true;
  }

  const validation = getValidationErrors(error);
  const message =
    validation?.message ?? (error instanceof Error ? error.message : "");

  if (/rule already exists/i.test(message)) {
    return true;
  }

  return Object.values(validation?.errors ?? {}).some((messages) =>
    messages.some((nextMessage) => /rule already exists/i.test(nextMessage))
  );
}
