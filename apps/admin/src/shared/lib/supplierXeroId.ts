/**
 * True when a supplier Xero ID is present for activation/API logic.
 * Treats `null`, `undefined`, and whitespace-only strings as absent (matches API `null`).
 */
export function hasSupplierXeroId(value: string | null | undefined): boolean {
  if (value == null) return false;
  return String(value).trim().length > 0;
}
