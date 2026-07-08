/**
 * Normalizes optional phone strings for UI display.
 * Trims whitespace; `isPresent` is false when there are no digits (e.g. lone "+"
 * from cleared international inputs).
 */
export function parsePhoneForDisplay(input: string | null | undefined): {
  value: string;
  isPresent: boolean;
} {
  const value = input?.trim() ?? "";
  return {
    value,
    isPresent: /\d/.test(value),
  };
}
