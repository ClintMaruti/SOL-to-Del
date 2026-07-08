import type { RatePlan } from "@/entities/service-option-rate-plan";

/** Active rate plans first, then alphabetical by name (case-insensitive). */
export function compareRatePlansForDefaultList(
  a: RatePlan,
  b: RatePlan
): number {
  if (a.isActive !== b.isActive) {
    return a.isActive ? -1 : 1;
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}
