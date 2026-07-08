/** Backend / API day tokens (Mon–Sun), aligned with Figma labels. */
export const OPERATING_DAY_CODES = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
] as const;

export type OperatingDayCode = (typeof OPERATING_DAY_CODES)[number];

export const OPERATING_DAY_COUNT = OPERATING_DAY_CODES.length;

export function createEmptyOperatingDaySelection(): boolean[] {
  return Array.from({ length: OPERATING_DAY_COUNT }, () => false);
}

export function createDefaultOperatingDaySelection(): boolean[] {
  return Array.from({ length: OPERATING_DAY_COUNT }, () => true);
}

export function operatingDaysFromSelection(selected: boolean[]): string[] {
  return OPERATING_DAY_CODES.filter((_, i) => Boolean(selected[i]));
}

export function operatingDaysToSelection(
  days: string[] | undefined | null
): boolean[] {
  const set = new Set((days ?? []).map((d) => String(d).trim().toUpperCase()));
  return OPERATING_DAY_CODES.map((code) => set.has(code));
}

export function scheduleServiceTypes(): readonly [
  "flight",
  "activity",
  "transportation",
] {
  return ["flight", "activity", "transportation"] as const;
}

export function isScheduleServiceType(
  serviceType: string | undefined
): serviceType is "flight" | "activity" | "transportation" {
  return (
    serviceType === "flight" ||
    serviceType === "activity" ||
    serviceType === "transportation"
  );
}

export function areTimesRequiredForServiceType(
  serviceType: string | undefined
): boolean {
  return serviceType === "flight";
}

export function areOperatingDaysRequiredForServiceType(
  serviceType: string | undefined
): boolean {
  return serviceType === "flight";
}
