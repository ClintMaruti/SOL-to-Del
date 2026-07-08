import type { RatePlan } from "@/entities/service-option-rate-plan";
import { describe, expect, it } from "vitest";

import { compareRatePlansForDefaultList } from "../lib/compareRatePlansForDefaultList";

function rp(
  partial: Pick<RatePlan, "name" | "isActive"> & Partial<RatePlan>
): RatePlan {
  return {
    id: partial.id ?? "id",
    serviceId: partial.serviceId ?? "svc-1",
    name: partial.name,
    validityDateFrom: partial.validityDateFrom ?? "",
    validityDateTo: partial.validityDateTo ?? "",
    payAtProperty: partial.payAtProperty ?? false,
    isActive: partial.isActive,
    version: partial.version ?? 1,
  };
}

describe("compareRatePlansForDefaultList", () => {
  it("orders active plans before inactive", () => {
    const inactive = rp({ name: "A", isActive: false });
    const active = rp({ name: "Z", isActive: true });
    expect(compareRatePlansForDefaultList(active, inactive)).toBeLessThan(0);
    expect(compareRatePlansForDefaultList(inactive, active)).toBeGreaterThan(0);
  });

  it("sorts by name within the same status", () => {
    const a = rp({ name: "Early Bird", isActive: true });
    const b = rp({ name: "Resident", isActive: true });
    expect(compareRatePlansForDefaultList(a, b)).toBeLessThan(0);
  });

  it("sorts inactive plans alphabetically", () => {
    const a = rp({ name: "September Specials 2024", isActive: false });
    const b = rp({ name: "Non-Resident Special 2025", isActive: false });
    expect(compareRatePlansForDefaultList(b, a)).toBeLessThan(0);
  });
});
