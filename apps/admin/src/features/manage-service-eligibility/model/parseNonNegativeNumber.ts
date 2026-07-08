export function parseNonNegativeNumber(value: string): number | null {
  if (value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, parsed);
}
