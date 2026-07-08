/**
 * Converts API `weekdays` (comma string or day codes array) to the domain `TravelDate.weekdays` string.
 */
export function normalizeWeekdaysFromApi(
  weekdays: string | string[] | undefined
): string | undefined {
  if (weekdays === undefined) return undefined;
  if (Array.isArray(weekdays)) {
    return weekdays.length ? weekdays.join(",") : undefined;
  }
  return weekdays.trim() === "" ? undefined : weekdays;
}

/**
 * Converts domain `TravelDate.weekdays` (comma-separated) to the API `weekdays` array.
 */
export function weekdaysToApiArray(weekdays: string | undefined): string[] {
  if (!weekdays?.trim()) return [];
  return weekdays
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const ALL_WEEKDAY_CODES = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
] as const;

function parseWeekdayCodes(weekdays: string | undefined): string[] {
  if (!weekdays?.trim()) return [];
  return weekdays
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

/** True when the selection is exactly all seven days (API default = no weekday restriction). */
export function isFullWeekdaySelection(codes: string[]): boolean {
  if (codes.length !== 7) return false;
  const set = new Set(codes);
  if (set.size !== 7) return false;
  return ALL_WEEKDAY_CODES.every((c) => set.has(c));
}

/**
 * Weekday codes to show inline beside travel dates. Empty when unset, or when the API
 * sends all seven days (treated as unrestricted — same as no specific days chosen).
 */
export function weekdaysForUiDisplay(weekdays: string | undefined): string[] {
  const codes = parseWeekdayCodes(weekdays);
  if (codes.length === 0) return [];
  if (isFullWeekdaySelection(codes)) return [];
  return codes;
}
