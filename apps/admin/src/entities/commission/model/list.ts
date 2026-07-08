import type { Commission } from "./types";

export function sortCommissionsByEffectiveFromDesc(
  commissions: Commission[]
): Commission[] {
  return [...commissions].sort((left, right) =>
    right.effectiveFrom.localeCompare(left.effectiveFrom)
  );
}

export function hasCommissionEffectiveFromConflict(
  commissions: Commission[],
  effectiveFrom: string,
  excludedCommissionId?: string | null
): boolean {
  return commissions.some(
    (commission) =>
      commission.id !== excludedCommissionId &&
      commission.effectiveFrom === effectiveFrom
  );
}
