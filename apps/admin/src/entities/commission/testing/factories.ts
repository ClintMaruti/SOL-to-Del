import type { Commission } from "../model/types";

export const createCommission = (
  id: string,
  effectiveFrom: string,
  options?: Partial<Omit<Commission, "id" | "effectiveFrom">>
): Commission => ({
  id,
  effectiveFrom,
  agencyId: options?.agencyId ?? "agency-1",
  commissionPercent: options?.commissionPercent ?? 7,
  version: options?.version ?? 1,
});
