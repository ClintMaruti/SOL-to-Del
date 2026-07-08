import { describe, expect, it } from "vitest";

import type { ContractedRate } from "@/entities/contracted-rate";

import { groupContractedRates } from "../lib/groupContractedRates";

function makeRow(
  overrides: Partial<ContractedRate> & Pick<ContractedRate, "id">
): ContractedRate {
  return {
    id: overrides.id,
    contractedRateId: overrides.contractedRateId ?? "parent-1",
    contractId: "contract-1",
    serviceOptionId: "opt-1",
    rateId: overrides.rateId ?? "rate-1",
    seasonName: overrides.seasonName ?? "Peak",
    priority: overrides.priority ?? 1,
    dates: overrides.dates ?? [
      {
        id: "date-1",
        travelDateFrom: "2025-01-01",
        travelDateTo: "2025-03-31",
        weekdays: ["Mon", "Tue"],
      },
    ],
    net: overrides.net ?? { currency: "USD", value: 100 },
    rack: overrides.rack ?? { currency: "USD", value: 120 },
    sell: overrides.sell ?? { currency: "USD", value: 110 },
    version: overrides.version ?? 1,
  };
}

describe("groupContractedRates", () => {
  it("groups rows by season, priority, and dates signature", () => {
    const rows = [
      makeRow({ id: "cr-1", rateId: "rate-a" }),
      makeRow({ id: "cr-2", rateId: "rate-b" }),
    ];

    const groups = groupContractedRates(rows);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.rows).toHaveLength(2);
    expect(groups[0]?.seasonName).toBe("Peak");
    expect(groups[0]?.priority).toBe(1);
  });

  it("creates separate groups for different season or priority", () => {
    const rows = [
      makeRow({ id: "cr-1", seasonName: "Peak", priority: 1 }),
      makeRow({ id: "cr-2", seasonName: "Low", priority: 2 }),
    ];

    const groups = groupContractedRates(rows);

    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.seasonName).sort()).toEqual(["Low", "Peak"]);
  });

  it("sorts groups by priority then season name", () => {
    const rows = [
      makeRow({ id: "cr-1", seasonName: "Zebra", priority: 2 }),
      makeRow({ id: "cr-2", seasonName: "Alpha", priority: 1 }),
    ];

    const groups = groupContractedRates(rows);

    expect(groups[0]?.priority).toBe(1);
    expect(groups[0]?.seasonName).toBe("Alpha");
    expect(groups[1]?.priority).toBe(2);
  });
});
