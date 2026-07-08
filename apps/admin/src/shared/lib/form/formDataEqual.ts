/**
 * Normalizes a form field value for comparison.
 * - Booleans: returned as-is
 * - undefined/null: converted to ""
 * - Strings: trimmed
 */
export function normalizeFormValue(
  v: string | boolean | undefined | null
): string | boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "undefined" || v === null) return "";
  return String(v).trim();
}

/**
 * Value-based equality for a single form field (used for primitives, arrays, and nested objects).
 * - Primitives: booleans and string-like values (normalized)
 * - Arrays: same length and element-wise equality (strings normalized; objects compared by value)
 */
function formValueEqual(a: unknown, b: unknown): boolean {
  const bothBool = typeof a === "boolean" || typeof b === "boolean";
  if (bothBool) {
    return Boolean(a) === Boolean(b);
  }

  const aArr = Array.isArray(a);
  const bArr = Array.isArray(b);
  if (aArr && bArr) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!formValueEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (aArr !== bArr) return false;

  const aObj = a != null && typeof a === "object" && !Array.isArray(a);
  const bObj = b != null && typeof b === "object" && !Array.isArray(b);
  if (aObj && bObj) {
    const aKeys = Object.keys(a as object).sort();
    const bKeys = Object.keys(b as object).sort();
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if (!bKeys.includes(k)) return false;
      if (
        !formValueEqual(
          (a as Record<string, unknown>)[k],
          (b as Record<string, unknown>)[k]
        )
      ) {
        return false;
      }
    }
    return true;
  }
  if (aObj !== bObj) return false;

  return (
    normalizeFormValue(a as string | undefined | null) ===
    normalizeFormValue(b as string | undefined | null)
  );
}

/**
 * Value-based equality for form data objects.
 * Compares all keys in `keys`; strings are normalized (trimmed, empty null/undefined).
 * Supports arrays (of strings or objects) via element-wise comparison.
 * Use for isDirty checks to avoid reference-based equality issues.
 */
export function formDataEqual<T extends object>(
  a: T,
  b: T,
  keys: readonly (keyof T)[]
): boolean {
  for (const key of keys) {
    if (!formValueEqual(a[key], b[key])) return false;
  }
  return true;
}
